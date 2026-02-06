const nextConfig = {
  output: 'export',
  
  // Ignore Linter errors during build
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Ignore TypeScript errors during build (prevents "Type error" crashes)
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;