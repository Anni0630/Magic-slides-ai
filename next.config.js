/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    // Client-side specific configurations
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        stream: false,
        crypto: false,
        os: false,
      };
    }

    // Ignore node: protocol imports
    config.module.rules.push({
      test: /\.js$/,
      resolve: {
        fullySpecified: false
      }
    });

    return config;
  },
  // Disable ESLint during build if needed
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Disable TypeScript errors during build if needed
  typescript: {
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig