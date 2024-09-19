/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
      remotePatterns: [
        {
          protocol: 'https',
          hostname: '**.ipfs.io', // Allow IPFS gateway URLs
        },
        {
          protocol: 'https',
          hostname: '**.your-other-image-source.com', // Any other domains you're loading images from
        },
      ],
    },
  };
  
  export default nextConfig;
  