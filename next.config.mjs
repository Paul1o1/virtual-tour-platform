/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // PSV manages its own canvas lifecycle
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
