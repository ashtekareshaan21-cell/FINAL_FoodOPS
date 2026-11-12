import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

if (fs.existsSync(path.join(process.cwd(), '.env.local'))) {
  dotenv.config({ path: path.join(process.cwd(), '.env.local') });
}
dotenv.config();

import { defineConfig } from 'prisma/config';

const isPlaceholder = (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('[YOUR-PASSWORD]')) ||
  (process.env.DIRECT_URL && process.env.DIRECT_URL.includes('[YOUR-PASSWORD]'));

const dbUrl = process.env.DATABASE_URL?.startsWith('file:')
  ? process.env.DATABASE_URL
  : (!isPlaceholder && process.env.DIRECT_URL)
    ? process.env.DIRECT_URL
    : ((!isPlaceholder && process.env.DATABASE_URL) ? process.env.DATABASE_URL : 'file:./dev.db');

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: dbUrl,
  },
});
