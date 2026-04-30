import type { NextConfig } from "next";
import withBundleAnalyzer from "@next/bundle-analyzer";

const config: NextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ["framer-motion", "@react-three/drei"],
  },
  webpack(cfg) {
    cfg.module.rules.push({
      test: /\.glsl$/,
      type: "asset/source",
    });
    return cfg;
  },
};

export default withBundleAnalyzer({ enabled: process.env.ANALYZE === "true" })(config);
