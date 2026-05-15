import { config } from 'dotenv';
import path from 'path';

config({ path: path.resolve(__dirname, '.env') });

import { defineConfig } from 'prisma/config';

export default defineConfig({
  earlyAccess: true,
  schema: './prisma/schema.prisma',
});
