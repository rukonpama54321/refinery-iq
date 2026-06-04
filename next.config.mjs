/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output so the Docker image is lean (Dockerfile copies .next/standalone)
  output: "standalone",
  reactStrictMode: true,
  experimental: {
    // server actions / route handlers stream LLM responses
  },
};

export default nextConfig;
