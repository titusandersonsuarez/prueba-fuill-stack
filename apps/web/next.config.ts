import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  transpilePackages: ['@prescriptions/shared'],
  output: 'standalone',
  // Needed so Next.js traces monorepo dependencies into the standalone bundle
  outputFileTracingRoot: path.join(__dirname, '../../'),
};

export default nextConfig;
