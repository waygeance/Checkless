import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  envDir: "../",
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("@clerk")) return "clerk";
          if (id.includes("framer-motion") || id.includes("motion-dom")) {
            return "motion";
          }
          if (id.includes("lucide-react")) return "icons";
          if (id.includes("react") || id.includes("scheduler")) {
            return "react-vendor";
          }
          return undefined;
        }
      }
    }
  },
  server: {
    port: 5173,
    proxy: {
      "/socket.io": {
        target: "http://localhost:8081",
        ws: true
      }
    }
  }
});
