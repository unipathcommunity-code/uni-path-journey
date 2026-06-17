import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@unipath/db": path.resolve(__dirname, "../../packages/db/src/index.ts"),
      "@unipath/auth": path.resolve(__dirname, "../../packages/auth/src/index.ts"),
      "@unipath/tenant": path.resolve(__dirname, "../../packages/tenant/src/index.ts"),
      "@unipath/ui": path.resolve(__dirname, "./src/components/ui/index.ts"),
      "@unipath/unicoin": path.resolve(__dirname, "../../packages/unicoin/src/index.ts"),
      "@unipath/telegram": path.resolve(__dirname, "../../packages/telegram/src/index.ts"),
    },
    dedupe: ["react", "react-dom"],
  },
}));
