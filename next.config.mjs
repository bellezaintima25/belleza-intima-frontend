/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // Keep this for any external/CDN images added in the future
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
    ],
  },
};
export default nextConfig;
