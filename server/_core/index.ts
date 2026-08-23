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

  // CORS middleware — allow configured origins plus the published admin dashboard.
  // The explicit fallback keeps login working while a deployment picks up the env value.
  const configuredOrigins = (process.env.CORS_ALLOWED_ORIGINS || "")
    .split(",")
    .map(o => o.trim())
    .filter(Boolean);
  const allowedOrigins = Array.from(
    new Set([
      ...configuredOrigins,
      "https://msgatewayadm-4pkhhml8.manus.space",
    ]),
  );
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && allowedOrigins.includes(origin)) {
      res.header("Access-Control-Allow-Origin", origin);
      res.header("Access-Control-Allow-Credentials", "true");
    }
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization",
    );

    if (req.method === "OPTIONS") {
      res.sendStatus(200);
      return;
    }
    next();
  });

  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ limit: "1mb", extended: true }));

  // The admin UI is maintained and deployed as a separate Web App.
  // Keep a compatibility redirect so old bookmarks do not load a stale embedded copy.
  const adminDashboardUrl = "https://msgatewayadm-4pkhhml8.manus.space";
  app.get("/admin", (_req, res) => {
    res.redirect(302, adminDashboardUrl);
  });
  app.get("/admin/*", (_req, res) => {
    res.redirect(302, adminDashboardUrl);
  });

  registerOAuthRoutes(app);

  app.get("/api/health", (_req, res) => {
    res.json({ 
      ok: true, 
      timestamp: Date.now(),
    });
  });

  // Admin login route
  app.post("/api/admin/login", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      console.error("JWT_SECRET environment variable is not set");
      return res.status(500).json({ error: "Server configuration error" });
    }

    try {
      const { getAdminUserByEmail, verifyPassword } = await import("../db");
      const adminUser = await getAdminUserByEmail(email);

      if (!adminUser || !adminUser.passwordHash) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const isValid = await verifyPassword(password, adminUser.passwordHash);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const jwt = await import("jsonwebtoken");
      const token = jwt.default.sign(
        { role: adminUser.role, email: adminUser.email, adminId: adminUser.id },
        JWT_SECRET,
        { expiresIn: "1d" }
      );
      res.json({
        token,
        user: { id: adminUser.id, email: adminUser.email, name: adminUser.username, role: adminUser.role }
      });
    } catch (error) {
      console.error("Admin login error:", error);
      res.status(500).json({ error: "Login failed" });
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
    console.log(`[admin] dashboard is maintained separately at ${adminDashboardUrl}`);
  });
}

startServer().catch(console.error);
