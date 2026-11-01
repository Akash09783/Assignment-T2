/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  async rewrites() {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    // If backendUrl is an absolute URL, proxy requests from /api to the remote backend
    if (backendUrl.startsWith('http')) {
      return [
        {
          source: '/api/:path*',
          destination: `${backendUrl.replace(/\/$/, '')}/:path*`,
        },
      ];
    }
    return [];
  },
};

export default nextConfig;
