/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Removed rewrite - using custom API route handlers instead for better auth control
  output: 'standalone', // Required for Docker deployment
}

module.exports = nextConfig


