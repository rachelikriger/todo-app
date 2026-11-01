import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Proxying /api to the backend keeps the frontend origin-agnostic:
    // no API base URL baked into the client, no CORS juggling in the browser.
    proxy: {
      "/api": {
        target: process.env.VITE_API_PROXY ?? "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
});
