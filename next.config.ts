import type { NextConfig } from 'next';
const config: NextConfig = { outputFileTracingRoot: process.cwd(), turbopack: {root:process.cwd()}, images: { unoptimized: true }, trailingSlash: true };
export default config;
