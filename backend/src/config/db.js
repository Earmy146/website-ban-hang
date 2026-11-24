import 'dotenv/config';
import mongoose from 'mongoose';
import { seedDatabaseIfEmpty } from '../seeds/seed.js';

const DEFAULT_LOCAL_URI = 'mongodb://127.0.0.1:27017/veylix';

let memoryServer = null;
let connectPromise = null;

const dbState = {
  connected: false,
  mode: 'disconnected', // 'mongodb' | 'memory' | 'disconnected'
  uri: '',
};

function sanitizeUri(uri = '') {
  return String(uri).replace(/\/\/([^:@]+):([^@]+)@/, '//***:***@');
}

export function getDbStatus() {
  const isConnected = mongoose.connection.readyState === 1;
  return {
    connected: isConnected,
    mode: isConnected ? dbState.mode : 'disconnected',
    uri: dbState.uri ? sanitizeUri(dbState.uri) : '',
  };
}

/**
 * Kết nối Mongoose tới MongoDB local; nếu không có `mongod` đang chạy và
 * `ALLOW_MEMORY_DB !== 'false'` thì tự động bật `MongoMemoryServer` và nạp dữ liệu mẫu khi DB trống.
 * @param {{ autoSeed?: boolean }} options
 */
export async function connectDB({ autoSeed = true } = {}) {
  if (mongoose.connection.readyState === 1) {
    return getDbStatus();
  }

  if (connectPromise) {
    return connectPromise;
  }

  connectPromise = (async () => {
    const targetUri = process.env.MONGODB_URI || DEFAULT_LOCAL_URI;
    const allowMemoryFallback = process.env.ALLOW_MEMORY_DB !== 'false';
    const shouldAutoSeed = autoSeed && process.env.AUTO_SEED !== 'false';

    try {
      await mongoose.connect(targetUri, {
        serverSelectionTimeoutMS: 2500,
      });

      dbState.connected = true;
      dbState.mode = 'mongodb';
      dbState.uri = targetUri;
      console.log(`[db] Đã kết nối MongoDB tại ${sanitizeUri(targetUri)}`);

      if (shouldAutoSeed) {
        await seedDatabaseIfEmpty();
      }

      return getDbStatus();
    } catch (localErr) {
      if (!allowMemoryFallback) {
        dbState.connected = false;
        dbState.mode = 'disconnected';
        throw new Error(
          `Không thể kết nối MongoDB tại ${sanitizeUri(targetUri)}: ${localErr.message}`
        );
      }

      try {
        await mongoose.disconnect().catch(() => {});
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        memoryServer = await MongoMemoryServer.create({
          instance: { dbName: 'veylix' },
        });
        const memUri = memoryServer.getUri();

        await mongoose.connect(memUri);

        dbState.connected = true;
        dbState.mode = 'memory';
        dbState.uri = memUri;
        console.log(`[db] MongoDB local chưa bật — đã chuyển sang MongoMemoryServer (${memUri})`);

        if (shouldAutoSeed) {
          await seedDatabaseIfEmpty();
        }

        return getDbStatus();
      } catch (memErr) {
        dbState.connected = false;
        dbState.mode = 'disconnected';
        throw new Error(
          `Không thể kết nối cả MongoDB local (${localErr.message}) lẫn MongoMemoryServer (${memErr.message})`
        );
      }
    } finally {
      connectPromise = null;
    }
  })();

  return connectPromise;
}

export async function disconnectDB() {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  } finally {
    if (memoryServer) {
      await memoryServer.stop().catch(() => {});
      memoryServer = null;
    }
    dbState.connected = false;
    dbState.mode = 'disconnected';
    dbState.uri = '';
  }
}

export { seedDatabaseIfEmpty, seedDatabaseIfEmpty as seedIfEmpty };
export default { connectDB, disconnectDB, getDbStatus };
