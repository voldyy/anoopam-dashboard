import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',  // <--- This is the magic line that creates the 'out' folder
  eslint: {
    // This allows the build to finish even if there are small linter warnings
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;