/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // Allow LAN-origin access in Next.js dev mode for phone testing.
  allowedDevOrigins: ["192.168.2.12"],
  images: {
    unoptimized: true,
  },
}

export default nextConfig
