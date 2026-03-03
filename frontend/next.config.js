/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    const backend = process.env.BACKEND_URL || 'http://localhost:3001'
    return [{ source: '/api/:path*', destination: `${backend}/api/:path*` }]
  },
  async redirects() {
    const publicToLanding = [
      { source: '/about-us', destination: '/', permanent: true },
      { source: '/about', destination: '/', permanent: true },
      { source: '/products', destination: '/', permanent: true },
      { source: '/products/:path*', destination: '/', permanent: true },
      { source: '/collections', destination: '/', permanent: true },
      { source: '/collections/:path*', destination: '/', permanent: true },
      { source: '/cart', destination: '/', permanent: true },
      { source: '/checkout', destination: '/', permanent: true },
      { source: '/order-confirmation', destination: '/', permanent: true },
      { source: '/services', destination: '/', permanent: true },
      { source: '/contact', destination: '/', permanent: true },
    ]
    return publicToLanding
  },
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
}

module.exports = nextConfig
