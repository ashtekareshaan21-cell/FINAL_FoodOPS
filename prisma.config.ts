import 'dotenv/config';
import { defineConfig } from 'prisma/config';

const isPostgres = process.env.DATABASE_URL && (
  process.env.DATABASE_URL.startsWith('postgresql://') || 
  process.env.DATABASE_URL.startsWith('postgres://')
);
const dbUrl = isPostgres ? process.env.DATABASE_URL : 'file:./dev.db';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: dbUrl,
  },
});
