import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';
import net from 'net';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const backendDir = path.join(rootDir, 'backend');
const viteBin = path.join(rootDir, 'node_modules', 'vite', 'bin', 'vite.js');

const BACKEND_PORT = Number(process.env.PORT || 5000);

function isPortListening(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;
    const finish = (result) => {
      if (!settled) {
        settled = true;
        socket.destroy();
        resolve(result);
      }
    };
    socket.setTimeout(600);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false));
    socket.once('error', () => finish(false));
    socket.connect(port, host);
  });
}

async function waitForBackendReady(timeoutMs = 12000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`http://127.0.0.1:${BACKEND_PORT}/api/health`);
      if (res.ok) return true;
    } catch {
      // Đợi thêm
    }
    await new Promise((r) => setTimeout(r, 350));
  }
  return false;
}

async function main() {
  const children = [];

  const cleanup = () => {
    for (const child of children) {
      if (child && !child.killed) {
        try {
          child.kill('SIGTERM');
        } catch {}
      }
    }
  };

  process.on('SIGINT', () => {
    cleanup();
    process.exit(0);
  });
  process.on('SIGTERM', () => {
    cleanup();
    process.exit(0);
  });

  const alreadyUp =
    (await isPortListening(BACKEND_PORT, '127.0.0.1')) ||
    (await isPortListening(BACKEND_PORT, 'localhost'));

  if (alreadyUp) {
    console.log(`[dev-all] Backend đã hoạt động sẵn trên cổng ${BACKEND_PORT}.`);
  } else {
    console.log(`[dev-all] Đang khởi động Backend API trên cổng ${BACKEND_PORT}...`);
    const beProc = spawn(process.execPath, ['--watch', 'src/server.js'], {
      cwd: backendDir,
      stdio: 'inherit',
      env: { ...process.env, PORT: String(BACKEND_PORT) },
    });
    children.push(beProc);
    await waitForBackendReady(10000);
  }

  console.log('[dev-all] Đang khởi động Vite Frontend trên cổng 3000...');
  const extraArgs = process.argv.slice(2);
  const feProc = spawn(process.execPath, [viteBin, ...extraArgs], {
    cwd: rootDir,
    stdio: 'inherit',
    env: process.env,
  });
  children.push(feProc);

  feProc.on('exit', (code) => {
    cleanup();
    process.exit(code ?? 0);
  });
}

main().catch((err) => {
  console.error('[dev-all] Lỗi khởi chạy:', err);
  process.exit(1);
});
