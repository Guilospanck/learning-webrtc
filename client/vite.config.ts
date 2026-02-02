import { defineConfig, loadEnv } from "vite";

export default ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  const useProxy = env.VITE_USE_WS_PROXY === "true";

  return defineConfig({
    server: {
      port: 3000,
      proxy: useProxy
        ? {
            "/ws": {
              target: env.VITE_WS_TARGET,
              ws: true,
            },
          }
        : undefined,
    },
  });
};
