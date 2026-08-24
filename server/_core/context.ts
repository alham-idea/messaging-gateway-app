import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import jwt from "jsonwebtoken";
import { getAdminUserByEmail } from "../db";
import { sdk } from "./sdk";

type AdminJwtPayload = {
  adminId?: number;
  email?: string;
  role?: string;
};

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

async function authenticateAdminJwt(req: CreateExpressContextOptions["req"]): Promise<User | null> {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (typeof authHeader !== "string" || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) return null;

  try {
    const token = authHeader.slice("Bearer ".length).trim();
    const payload = jwt.verify(token, secret) as AdminJwtPayload;
    if (!payload.email || !payload.adminId) return null;

    const adminUser = await getAdminUserByEmail(payload.email);
    if (!adminUser || !adminUser.isActive) return null;
    if (adminUser.id !== payload.adminId) return null;
    if (adminUser.role !== "admin" && adminUser.role !== "super_admin") return null;

    return {
      id: adminUser.id,
      openId: `admin:${adminUser.id}`,
      name: adminUser.username,
      email: adminUser.email,
      loginMethod: "admin",
      role: "admin",
      isActive: adminUser.isActive,
      createdAt: new Date(0),
      updatedAt: new Date(0),
      lastSignedIn: new Date(),
    } as User;
  } catch {
    return null;
  }
}

export async function createContext(opts: CreateExpressContextOptions): Promise<TrpcContext> {
  const adminUser = await authenticateAdminJwt(opts.req);
  if (adminUser) {
    return {
      req: opts.req,
      res: opts.res,
      user: adminUser,
    };
  }

  let user: User | null = null;
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch {
    // Authentication is optional for public procedures.
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
