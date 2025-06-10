import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  // Try multiple possible build locations
  const possiblePaths = [
    path.resolve(import.meta.dirname, "..", "client", "dist"),
    path.resolve(import.meta.dirname, "..", "dist", "public"),
    path.resolve(import.meta.dirname, "public"),
    path.resolve("client/dist"),
    path.resolve("dist/public")
  ];
  
  let distPath = null;
  for (const possiblePath of possiblePaths) {
    if (fs.existsSync(possiblePath)) {
      distPath = possiblePath;
      console.log(`Found build directory at: ${distPath}`);
      break;
    }
  }

  if (!distPath) {
    console.error("Searched for build directory in:");
    possiblePaths.forEach(p => console.error(`  - ${p}`));
    throw new Error(
      `Could not find the build directory in any of the expected locations. Make sure to build the client first.`,
    );
  }

  // Serve static files
  app.use(express.static(distPath));

  // SPA fallback - serve index.html for all non-API routes
  app.get("*", (req, res, next) => {
    // Skip API routes and service worker
    if (req.path.startsWith("/api") || req.path.startsWith("/sw.js")) {
      return next();
    }
    
    // Serve React app for all other routes
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}