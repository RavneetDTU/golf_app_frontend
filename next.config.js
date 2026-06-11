const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow API calls to the backend server
  async rewrites() {
    return []
  },
}

module.exports = withPWA(nextConfig)
