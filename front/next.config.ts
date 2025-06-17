import type { NextConfig } from "next";
import path from 'path';
import {makeEnvPublic} from "next-runtime-env";

makeEnvPublic('EXCHANGE_API');


const nextConfig: NextConfig = {
  // Configure next-runtime-env
  env: {
    NEXT_PUBLIC_EXCHANGE_API: process.env.EXCHANGE_API
  },
  // Add the runtime-env.js file to the webpack configuration
  webpack: (config, { isServer }) => {
    // Only apply in client-side builds
    if (!isServer) {
      // Add the runtime-env.js file to the webpack configuration
      config.resolve.alias['runtime-env'] = path.join(__dirname, 'runtime-env.js');
    }
    return config;
  },
};

export default nextConfig;
