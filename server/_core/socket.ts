import type { Server as HttpServer } from "http";
import { Server as SocketIOServer, type Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { getAdminUserByEmail } from "../db";

type AdminJwtPayload = {
  adminId?: number;
  email?: string;
};

type AuthenticatedAdmin = {
  id: number;
  email: string;
  role: "admin" | "super_admin";
};

export type RealtimeEvents = {
  notification: (payload: Record<string, unknown>) => void;
  update: (payload: Record<string, unknown>) => void;
  "admin:notification": (payload: Record<string, unknown>) => void;
  "admin:update": (payload: Record<string, unknown>) => void;
};

function getAllowedOrigins(): string[] {
  const configured = (process.env.CORS_ALLOWED_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  const development = process.env.NODE_ENV === "production"
    ? []
    : [
        "http://localhost:4173",
        "http://localhost:4174",
        "http://127.0.0.1:4173",
        "http://127.0.0.1:4174",
      ];

  return Array.from(
    new Set([
      ...configured,
      ...development,
      "https://msgatewayadm-4pkhhml8.manus.space",
    ]),
  );
}

async function authenticateSocket(socket: Socket): Promise<AuthenticatedAdmin | null> {
  const token = socket.handshake.auth?.token;
  const secret = process.env.JWT_SECRET;
  if (typeof token !== "string" || !token || !secret) return null;

  try {
    const payload = jwt.verify(token, secret) as AdminJwtPayload;
    if (!payload.email || !payload.adminId) return null;

    const admin = await getAdminUserByEmail(payload.email);
    if (!admin || !admin.isActive || admin.id !== payload.adminId) return null;
    if (admin.role !== "admin" && admin.role !== "super_admin") return null;

    return { id: admin.id, email: admin.email, role: admin.role };
  } catch {
    return null;
  }
}

export function attachSocketServer(httpServer: HttpServer): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    path: "/socket.io",
    transports: ["websocket", "polling"],
    cors: {
      origin: getAllowedOrigins(),
      credentials: true,
      methods: ["GET", "POST"],
    },
  });

  io.use(async (socket, next) => {
    const admin = await authenticateSocket(socket);
    if (!admin) {
      next(new Error("Unauthorized socket connection"));
      return;
    }
    socket.data.admin = admin;
    next();
  });

  io.on("connection", (socket) => {
    const admin = socket.data.admin as AuthenticatedAdmin;
    socket.join(`admin:${admin.id}`);
    socket.on("admin:subscribe", () => {
      socket.join("admins");
      socket.emit("connection_status", { connected: true, timestamp: Date.now() });
    });
    socket.on("disconnect", () => {
      socket.leave("admins");
      socket.leave(`admin:${admin.id}`);
    });
  });

  return io;
}

export function emitAdminRealtimeUpdate(
  io: SocketIOServer,
  event: "notification" | "update" | "admin:notification" | "admin:update",
  payload: Record<string, unknown>,
): void {
  io.to("admins").emit(event, payload);
}
