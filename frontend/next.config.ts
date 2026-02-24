/* eslint-disable @typescript-eslint/no-require-imports */
/// <reference types="node" />

// next-pwa is a CJS module; require() is valid here since Next.js
// processes next.config.ts as CommonJS internally.
const withPWA = require("next-pwa")({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /^\/api\//,
      handler: "NetworkFirst",
      options: { cacheName: "api-cache", networkTimeoutSeconds: 5 },
    },
  ],
});

export default withPWA({
  reactCompiler: true,
  turbopack: {},
});
