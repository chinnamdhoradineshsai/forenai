import { fileURLToPath, URL } from "url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import environment from "vite-plugin-environment";
import fs from "fs";
import path from "path";

const ii_url =
  process.env.DFX_NETWORK === "local"
    ? `http://rdmx6-jaaaa-aaaaa-aaadq-cai.localhost:8081/`
    : `https://identity.internetcomputer.org/`;

process.env.II_URL = process.env.II_URL || ii_url;
process.env.STORAGE_GATEWAY_URL =
  process.env.STORAGE_GATEWAY_URL || "https://blob.caffeine.ai";

export default defineConfig({
  logLevel: "error",
  build: {
    emptyOutDir: true,
    sourcemap: false,
    minify: false,
  },
  css: {
    postcss: "./postcss.config.js",
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: "globalThis",
      },
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:4943",
        changeOrigin: true,
      },
    },
  },
  plugins: [
    environment("all", { prefix: "CANISTER_" }),
    environment("all", { prefix: "DFX_" }),
    environment(["II_URL"]),
    environment(["STORAGE_GATEWAY_URL"]),
    react(),
    {
      name: "serve-uploads",
      configureServer(server) {
        const uploadsPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../uploads");
        server.middlewares.use((req, res, next) => {
          const decodedUrl = decodeURIComponent(req.url.split("?")[0]);
          if (decodedUrl.startsWith("/uploads/")) {
            const relativePath = decodedUrl.substring("/uploads/".length);
            const filePath = path.join(uploadsPath, relativePath);
            if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
              const ext = path.extname(filePath).toLowerCase();
              let mimeType = "application/octet-stream";
              if (ext === ".jpg" || ext === ".jpeg") mimeType = "image/jpeg";
              else if (ext === ".png") mimeType = "image/png";
              else if (ext === ".gif") mimeType = "image/gif";
              else if (ext === ".svg") mimeType = "image/svg+xml";
              else if (ext === ".pdf") mimeType = "application/pdf";
              else if (ext === ".mp3") mimeType = "audio/mpeg";
              else if (ext === ".m4a") mimeType = "audio/mp4";
              else if (ext === ".mp4") mimeType = "video/mp4";
              else if (ext === ".txt") mimeType = "text/plain";
              
              res.writeHead(200, { "Content-Type": mimeType });
              fs.createReadStream(filePath).pipe(res);
              return;
            }
          }
          next();
        });
      }
    }
  ],
  resolve: {
    alias: [
      {
        find: "declarations",
        replacement: fileURLToPath(new URL("../declarations", import.meta.url)),
      },
      {
        find: "@",
        replacement: fileURLToPath(new URL("./src", import.meta.url)),
      },
    ],
    dedupe: ["@dfinity/agent"]
  },
});
