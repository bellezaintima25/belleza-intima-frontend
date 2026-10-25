/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // Cloudflare R2 public bucket
      {
        protocol: 'https',
        hostname: 'pub-463c68e8bfb54ae3a8372a52d2d2f105.r2.dev',
      },
      // Keep this for any other external/CDN images
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      // Backend local (desarrollo): sirve /images subidas desde IMAGES_DIR
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
      },
    ],
  },
};
export default nextConfig;
