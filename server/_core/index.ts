import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Enable CORS for all routes - reflect the request origin to support credentials
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
      res.header("Access-Control-Allow-Origin", origin);
    }
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization",
    );
    res.header("Access-Control-Allow-Credentials", "true");

    // Handle preflight requests
    if (req.method === "OPTIONS") {
      res.sendStatus(200);
      return;
    }
    next();
  });

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Serve admin dashboard
  app.use("/admin", express.static("public/admin"));
  app.get("/admin/*", (_req, res) => {
    res.sendFile("public/admin/index.html", { root: process.cwd() });
  });

  registerOAuthRoutes(app);

  app.get("/api/health", (_req, res) => {
    res.json({ 
      ok: true, 
      timestamp: Date.now(),
      admin: "http://localhost:" + port + "/admin"
    });
  });

  // Admin login route
  app.post("/api/admin/login", (req, res) => {
    const { email, password } = req.body;
    // In a real app, verify against DB and hash. For demo/admin:
    if (email === "admin@example.com" && password === "password") {
      const jwt = require("jsonwebtoken");
      const token = jwt.sign({ role: "admin", email }, process.env.JWT_SECRET || "your-secret-key-change-in-production", { expiresIn: "1d" });
      res.json({
        token,
        user: { id: 1, email, name: "Admin", role: "admin" }
      });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    }),
  );

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`[api] server listening on port ${port}`);
    console.log(`[admin] dashboard available at http://localhost:${port}/admin`);
  });
}

startServer().catch(console.error);
