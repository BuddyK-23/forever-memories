/** @type {import('next').NextConfig} */
import webpack from 'webpack';
import { resolve } from 'path';

const nextConfig = {
  images: {
    domains: ['ipfs.io', 'api.universalprofile.cloud'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.ipfs.io',
      },
      {
        protocol: 'https',
        hostname: '**.your-other-image-source.com',
      },
    ],
  },
};

export default nextConfig;
