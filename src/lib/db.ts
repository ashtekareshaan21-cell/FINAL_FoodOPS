import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prismaCache?: Record<string, PrismaClient> };

function createPrismaClient(url: string): PrismaClient {
  const isPostgres = url.startsWith('postgresql://') || url.startsWith('postgres://');
  if (isPostgres) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Pool } = require('pg');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaPg } = require('@prisma/adapter-pg');
    const pool = new Pool({ connectionString: url });
    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter });
  } else {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
    const adapter = new PrismaBetterSqlite3({
      url,
    });
    return new PrismaClient({ adapter });
  }
}

function getPrismaClient(): PrismaClient {
  const dbUrl = process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('file:')
    ? process.env.DATABASE_URL
    : (process.env.DATABASE_URL && (process.env.DATABASE_URL.startsWith('postgresql://') || process.env.DATABASE_URL.startsWith('postgres://'))
        ? process.env.DATABASE_URL
        : 'file:./dev.db');

  if (process.env.NODE_ENV === 'production') {
    return createPrismaClient(dbUrl);
  }

  if (!globalForPrisma.prismaCache) {
    globalForPrisma.prismaCache = {};
  }

  if (!globalForPrisma.prismaCache[dbUrl]) {
    globalForPrisma.prismaCache[dbUrl] = createPrismaClient(dbUrl);
  }

  return globalForPrisma.prismaCache[dbUrl];
}

export const prisma = new Proxy({} as PrismaClient, {
  get(target, prop) {
    const client = getPrismaClient();
    const value = Reflect.get(client, prop);
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  }
});
