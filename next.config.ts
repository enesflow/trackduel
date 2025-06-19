import { setupDevPlatform } from '@cloudflare/next-on-pages/next-dev';

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["i.scdn.co", "i.ytimg.com"],
  },
};

if (process.env.NODE_ENV === 'development') {
  setupDevPlatform().catch(e => console.error(e));
}

export default nextConfig;
