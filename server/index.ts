import 'dotenv/config';

import express, { type Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Service worker route - correct path for client/public
app.get('/sw.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Service-Worker-Allowed', '/');
  
  const swPath = path.join(__dirname, '../client/public/sw.js');
  
  if (fs.existsSync(swPath)) {
    res.sendFile(path.resolve(swPath));
  } else {
    res.status(404).send('Service worker not found');
  }
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Create HTTP server BEFORE calling registerRoutes
  const server = createServer(app);
  
  // Dynamic import for WebSocket setup
  const websocketModule = await import('./websocket' as any);
  const setupWebSocket = websocketModule.setupWebSocket || websocketModule.default;
  
  // Setup WebSocket
  const io = setupWebSocket(server);
  app.set('io', io);

  // Now register routes
  await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  

// const port = process.env.PORT || 5000;
// server.listen(port, () => {
//     log(`serving on port ${port}`);
// });
const port = 5000;
server.listen(port, 'localhost', () => {
    log(`serving on port ${port}`);
  });
})();