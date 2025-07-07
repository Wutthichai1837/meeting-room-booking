/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    // Allow local images
    unoptimized: process.env.NODE_ENV === 'development',
  },
  // Enable strict mode for better error checking
  reactStrictMode: true,
}

module.exports = nextConfig
