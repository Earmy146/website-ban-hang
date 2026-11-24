import 'dotenv/config';
import http from 'node:http';
import app from './app.js';
import * as dbModule from './config/db.js';

const PORT = Number(process.env.PORT) || 5000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function probeVeylixHealthOnce(port, timeoutMs = 800) {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      resolve(result);
    };

    const req = http.get(
      {
        hostname: '127.0.0.1',
        port,
        path: '/api/health',
        agent: false,
        headers: { Connection: 'close' },
        timeout: timeoutMs
      },
      (res) => {
        if (res.statusCode !== 200) {
          res.resume();
          finish(false);
          return;
        }
        let raw = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          raw += chunk;
        });
        res.on('end', () => {
          try {
            const json = JSON.parse(raw);
            finish(Boolean(json?.success === true && json?.data?.status === 'ok'));
          } catch {
            finish(false);
          }
        });
      }
    );

    req.on('timeout', () => {
      req.destroy();
      finish(false);
    });
    req.on('error', () => {
      finish(false);
    });
  });
}

async function isExistingVeylixServerRunning(port) {
  const firstCheck = await probeVeylixHealthOnce(port, 700);
  if (!firstCheck) return false;
  // Chờ ngắn và kiểm tra lần 2 để phân biệt máy chủ đang chạy thật với tiến trình cũ đang đóng khi --watch restart
  await sleep(300);
  return probeVeylixHealthOnce(port, 700);
}

function tryListenOnce(port) {
  return new Promise((resolve, reject) => {
    const srv = http.createServer(app);

    const onError = (err) => {
      srv.removeListener('listening', onListening);
      reject(err);
    };

    const onListening = () => {
      srv.removeListener('error', onError);
      resolve(srv);
    };

    srv.once('error', onError);
    srv.once('listening', onListening);
    srv.listen(port);
  });
}

async function listenWithRetry(port, retries = 5, delayMs = 450) {
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const server = await tryListenOnce(port);
      server.on('error', (err) => {
        console.error('[Veylix Backend] Lỗi kết nối máy chủ HTTP:', err.message);
      });
      return server;
    } catch (err) {
      if (err?.code === 'EADDRINUSE') {
        if (attempt < retries) {
          await sleep(delayMs);
          continue;
        }

        // Đã hết lượt retry mà cổng vẫn bận: kiểm tra xem có Veylix Backend khác đang chạy khỏe không
        const healthyPeer = await probeVeylixHealthOnce(port, 1000);
        if (typeof dbModule.disconnectDB === 'function') {
          await dbModule.disconnectDB().catch(() => {});
        }

        if (healthyPeer) {
          console.log(
            `[Veylix Backend] Cổng ${port} đã có máy chủ Veylix đang hoạt động sẵn, không cần khởi chạy trùng lặp.`
          );
          process.exitCode = 0;
          return null;
        }

        console.error(
          `[Veylix Backend] Không thể khởi chạy vì cổng ${port} đang được sử dụng bởi tiến trình khác. Hãy đóng tiến trình chiếm cổng ${port} hoặc đổi PORT trong backend/.env.`
        );
        process.exitCode = 1;
        return null;
      }

      throw err;
    }
  }
  return null;
}

async function bootstrap() {
  try {
    // 1. Kiểm tra sớm trước khi khởi tạo DB / MongoMemoryServer để tránh tốn tài nguyên nếu server đã bật ở cửa sổ khác
    if (await isExistingVeylixServerRunning(PORT)) {
      console.log(
        `[Veylix Backend] Cổng ${PORT} đã có máy chủ Veylix đang hoạt động sẵn, không cần khởi chạy trùng lặp.`
      );
      process.exitCode = 0;
      return;
    }

    // 2. Kết nối MongoDB (hoặc MongoMemoryServer fallback)
    if (typeof dbModule.connectDB === 'function') {
      await dbModule.connectDB();
    }

    const dbStatus =
      typeof dbModule.getDbStatus === 'function'
        ? dbModule.getDbStatus()
        : { connected: true, mode: 'mongodb' };

    // 3. Lắng nghe cổng với cơ chế retry chống xung đột cổng tạm thời khi node --watch tự động restart trên Windows
    const server = await listenWithRetry(PORT, 5, 450);
    if (!server) return;

    console.log(
      `[Veylix Backend] Máy chủ đang chạy tại http://localhost:${PORT} (Chế độ DB: ${dbStatus.mode || 'mongodb'})`
    );

    let isShuttingDown = false;
    const shutdown = async (signal) => {
      if (isShuttingDown) return;
      isShuttingDown = true;

      console.log(`[Veylix Backend] Nhận tín hiệu ${signal}, đang giải phóng cổng ${PORT} và đóng kết nối...`);

      // Fallback timeout 1500ms đảm bảo tiến trình cũ luôn thoát dứt khoát khi node --watch restart
      const forceExitTimer = setTimeout(() => {
        process.exit(0);
      }, 1500);
      forceExitTimer.unref?.();

      try {
        // Ngắt tức thì mọi kết nối HTTP keep-alive để giải phóng cổng ngay lập tức trên Windows
        server.closeIdleConnections?.();
        server.closeAllConnections?.();

        await new Promise((resolve) => {
          server.close(() => resolve());
        });

        if (typeof dbModule.disconnectDB === 'function') {
          await dbModule.disconnectDB().catch(() => {});
        }
      } finally {
        clearTimeout(forceExitTimer);
        process.exitCode = 0;
      }
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGBREAK', () => shutdown('SIGBREAK'));
  } catch (err) {
    console.error('[Veylix Backend] Không thể khởi động máy chủ:', err?.message || err);
    if (typeof dbModule.disconnectDB === 'function') {
      await dbModule.disconnectDB().catch(() => {});
    }
    process.exitCode = 1;
  }
}

bootstrap();
