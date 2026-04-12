/** @type {import('next').NextConfig} */
const nextConfig = {
  // Temporary: source maps in prod to debug TDZ crash with real var names
  productionBrowserSourceMaps: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
}
module.exports = nextConfig
