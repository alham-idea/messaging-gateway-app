import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response, NextFunction } from "express";
import {
  authMiddleware,
  adminAuthMiddleware,
  corsMiddleware,
  validationMiddleware,
  errorHandlerMiddleware,
  securityHeadersMiddleware,
  requestIdMiddleware,
  healthCheckMiddleware,
} from "../server/_core/middleware";
import * as jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

function createMockRes(): Response & { _status: number; _json: unknown; _headers: Record<string, string> } {
  const res = {
    _status: 0,
    _json: undefined as unknown,
    _headers: {} as Record<string, string>,
    status(code: number) {
      res._status = code;
      return res;
    },
    json(body: unknown) {
      res._json = body;
      return res;
    },
    sendStatus(code: number) {
      res._status = code;
      return res;
    },
    header(key: string, value: string) {
      res._headers[key] = value;
      return res;
    },
    on: vi.fn(),
    get: vi.fn(),
  } as unknown as Response & { _status: number; _json: unknown; _headers: Record<string, string> };
  return res;
}

function createMockReq(overrides: Partial<Request> = {}): Request {
  return {
    headers: {},
    method: "GET",
    path: "/",
    ip: "127.0.0.1",
    body: undefined,
    query: {},
    get: vi.fn(),
    ...overrides,
  } as unknown as Request;
}

describe("authMiddleware", () => {
  it("returns 401 when no Authorization header", () => {
    const req = createMockReq();
    const res = createMockRes();
    const next = vi.fn();

    authMiddleware(req, res, next);

    expect(res._status).toBe(401);
    expect((res._json as { code: string }).code).toBe("NO_TOKEN");
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 when Authorization header does not start with Bearer", () => {
    const req = createMockReq({ headers: { authorization: "Basic abc" } });
    const res = createMockRes();
    const next = vi.fn();

    authMiddleware(req, res, next);

    expect(res._status).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 for an invalid token", () => {
    const req = createMockReq({ headers: { authorization: "Bearer invalid.token.here" } });
    const res = createMockRes();
    const next = vi.fn();

    authMiddleware(req, res, next);

    expect(res._status).toBe(401);
    expect((res._json as { code: string }).code).toBe("INVALID_TOKEN");
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 with TOKEN_EXPIRED for an expired token", () => {
    const token = jwt.sign({ id: 1 }, JWT_SECRET, { expiresIn: "-1s" });
    const req = createMockReq({ headers: { authorization: `Bearer ${token}` } });
    const res = createMockRes();
    const next = vi.fn();

    authMiddleware(req, res, next);

    expect(res._status).toBe(401);
    expect((res._json as { code: string }).code).toBe("TOKEN_EXPIRED");
    expect(next).not.toHaveBeenCalled();
  });

  it("calls next and attaches user for a valid token", () => {
    const payload = { id: 42, role: "user" };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });
    const req = createMockReq({ headers: { authorization: `Bearer ${token}` } });
    const res = createMockRes();
    const next = vi.fn();

    authMiddleware(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect((req as unknown as Record<string, unknown>).user).toMatchObject(payload);
  });
});

describe("adminAuthMiddleware", () => {
  it("returns 401 when no user is on request", () => {
    const req = createMockReq();
    const res = createMockRes();
    const next = vi.fn();

    adminAuthMiddleware(req, res, next);

    expect(res._status).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 403 when user role is not admin", () => {
    const req = createMockReq();
    (req as unknown as Record<string, unknown>).user = { id: 1, role: "user" };
    const res = createMockRes();
    const next = vi.fn();

    adminAuthMiddleware(req, res, next);

    expect(res._status).toBe(403);
    expect((res._json as { code: string }).code).toBe("INSUFFICIENT_PERMISSIONS");
    expect(next).not.toHaveBeenCalled();
  });

  it("calls next when user is admin", () => {
    const req = createMockReq();
    (req as unknown as Record<string, unknown>).user = { id: 1, role: "admin" };
    const res = createMockRes();
    const next = vi.fn();

    adminAuthMiddleware(req, res, next);

    expect(next).toHaveBeenCalledOnce();
  });
});

describe("corsMiddleware", () => {
  it("sets CORS headers and calls next for non-OPTIONS", () => {
    const req = createMockReq({ headers: { origin: "http://localhost:3000" }, method: "GET" });
    const res = createMockRes();
    const next = vi.fn();

    corsMiddleware(req, res, next);

    expect(res._headers["Access-Control-Allow-Methods"]).toContain("GET");
    expect(res._headers["Access-Control-Allow-Credentials"]).toBe("true");
    expect(next).toHaveBeenCalledOnce();
  });

  it("returns 200 for OPTIONS preflight", () => {
    const req = createMockReq({ headers: { origin: "http://localhost:3000" }, method: "OPTIONS" });
    const res = createMockRes();
    const next = vi.fn();

    corsMiddleware(req, res, next);

    expect(res._status).toBe(200);
    expect(next).not.toHaveBeenCalled();
  });

  it("sets Allow-Origin header when origin is in allowed list", () => {
    const req = createMockReq({ headers: { origin: "http://localhost:3000" }, method: "GET" });
    const res = createMockRes();
    const next = vi.fn();

    corsMiddleware(req, res, next);

    expect(res._headers["Access-Control-Allow-Origin"]).toBe("http://localhost:3000");
  });

  it("does not set Allow-Origin header for disallowed origin", () => {
    const req = createMockReq({ headers: { origin: "http://evil.com" }, method: "GET" });
    const res = createMockRes();
    const next = vi.fn();

    corsMiddleware(req, res, next);

    expect(res._headers["Access-Control-Allow-Origin"]).toBeUndefined();
    expect(next).toHaveBeenCalled();
  });
});

describe("validationMiddleware", () => {
  it("sanitizes HTML characters in body strings", () => {
    const req = createMockReq({ body: { name: '<script>alert("xss")</script>' } });
    const res = createMockRes();
    const next = vi.fn();

    validationMiddleware(req, res, next);

    expect(req.body.name).not.toContain("<script>");
    expect(req.body.name).toContain("&lt;");
    expect(next).toHaveBeenCalledOnce();
  });

  it("sanitizes nested objects", () => {
    const req = createMockReq({ body: { outer: { inner: "<b>bold</b>" } } });
    const res = createMockRes();
    const next = vi.fn();

    validationMiddleware(req, res, next);

    expect(req.body.outer.inner).not.toContain("<b>");
    expect(next).toHaveBeenCalledOnce();
  });

  it("sanitizes query parameters", () => {
    const req = createMockReq({ query: { q: "<img src=x>" } as Record<string, string> });
    const res = createMockRes();
    const next = vi.fn();

    validationMiddleware(req, res, next);

    expect((req.query as Record<string, string>).q).not.toContain("<img");
    expect(next).toHaveBeenCalledOnce();
  });

  it("calls next even without body or query", () => {
    const req = createMockReq({ body: undefined, query: undefined as unknown as Record<string, string> });
    const res = createMockRes();
    const next = vi.fn();

    validationMiddleware(req, res, next);

    expect(next).toHaveBeenCalledOnce();
  });
});

describe("errorHandlerMiddleware", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("returns 400 for ValidationError", () => {
    const err = new Error("bad field");
    err.name = "ValidationError";
    const req = createMockReq();
    const res = createMockRes();
    const next = vi.fn();

    errorHandlerMiddleware(err, req, res, next);

    expect(res._status).toBe(400);
    expect((res._json as { error: string }).error).toBe("VALIDATION_ERROR");
  });

  it("returns 401 for UnauthorizedError", () => {
    const err = new Error("no auth");
    err.name = "UnauthorizedError";
    const req = createMockReq();
    const res = createMockRes();
    const next = vi.fn();

    errorHandlerMiddleware(err, req, res, next);

    expect(res._status).toBe(401);
  });

  it("returns 403 for ForbiddenError", () => {
    const err = new Error("forbidden");
    err.name = "ForbiddenError";
    const req = createMockReq();
    const res = createMockRes();
    const next = vi.fn();

    errorHandlerMiddleware(err, req, res, next);

    expect(res._status).toBe(403);
  });

  it("returns 404 for NotFoundError", () => {
    const err = new Error("not found");
    err.name = "NotFoundError";
    const req = createMockReq();
    const res = createMockRes();
    const next = vi.fn();

    errorHandlerMiddleware(err, req, res, next);

    expect(res._status).toBe(404);
  });

  it("returns 409 for ConflictError", () => {
    const err = new Error("duplicate");
    err.name = "ConflictError";
    const req = createMockReq();
    const res = createMockRes();
    const next = vi.fn();

    errorHandlerMiddleware(err, req, res, next);

    expect(res._status).toBe(409);
  });

  it("returns 500 for generic errors", () => {
    const err = new Error("something broke");
    const req = createMockReq();
    const res = createMockRes();
    const next = vi.fn();

    errorHandlerMiddleware(err, req, res, next);

    expect(res._status).toBe(500);
    expect((res._json as { error: string }).error).toBe("INTERNAL_ERROR");
  });

  it("includes details in development mode", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    const err = new Error("dev error");
    const req = createMockReq();
    const res = createMockRes();
    const next = vi.fn();

    errorHandlerMiddleware(err, req, res, next);

    expect((res._json as { details: string }).details).toBe("dev error");

    process.env.NODE_ENV = originalEnv;
  });
});

describe("securityHeadersMiddleware", () => {
  it("sets X-Frame-Options to DENY", () => {
    const req = createMockReq();
    const res = createMockRes();
    const next = vi.fn();

    securityHeadersMiddleware(req, res, next);

    expect(res._headers["X-Frame-Options"]).toBe("DENY");
    expect(next).toHaveBeenCalledOnce();
  });

  it("sets X-Content-Type-Options to nosniff", () => {
    const req = createMockReq();
    const res = createMockRes();
    const next = vi.fn();

    securityHeadersMiddleware(req, res, next);

    expect(res._headers["X-Content-Type-Options"]).toBe("nosniff");
  });

  it("sets Content-Security-Policy", () => {
    const req = createMockReq();
    const res = createMockRes();
    const next = vi.fn();

    securityHeadersMiddleware(req, res, next);

    expect(res._headers["Content-Security-Policy"]).toBeDefined();
  });

  it("sets HSTS in production", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    const req = createMockReq();
    const res = createMockRes();
    const next = vi.fn();

    securityHeadersMiddleware(req, res, next);

    expect(res._headers["Strict-Transport-Security"]).toContain("max-age=");

    process.env.NODE_ENV = originalEnv;
  });

  it("does not set HSTS in development", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    const req = createMockReq();
    const res = createMockRes();
    const next = vi.fn();

    securityHeadersMiddleware(req, res, next);

    expect(res._headers["Strict-Transport-Security"]).toBeUndefined();

    process.env.NODE_ENV = originalEnv;
  });
});

describe("requestIdMiddleware", () => {
  it("uses existing x-request-id from headers", () => {
    const req = createMockReq({ headers: { "x-request-id": "custom-id-123" } });
    const res = createMockRes();
    const next = vi.fn();

    requestIdMiddleware(req, res, next);

    expect((req as unknown as Record<string, unknown>).id).toBe("custom-id-123");
    expect(res._headers["X-Request-ID"]).toBe("custom-id-123");
    expect(next).toHaveBeenCalledOnce();
  });

  it("generates a request id when none is provided", () => {
    const req = createMockReq();
    const res = createMockRes();
    const next = vi.fn();

    requestIdMiddleware(req, res, next);

    const id = (req as unknown as Record<string, unknown>).id as string;
    expect(id).toBeDefined();
    expect(id.length).toBeGreaterThan(0);
    expect(res._headers["X-Request-ID"]).toBe(id);
    expect(next).toHaveBeenCalledOnce();
  });
});

describe("healthCheckMiddleware", () => {
  it("returns health status JSON for /health path", () => {
    const req = createMockReq({ path: "/health" });
    const res = createMockRes();
    const next = vi.fn();

    healthCheckMiddleware(req, res, next);

    const body = res._json as { status: string; timestamp: string; uptime: number };
    expect(body.status).toBe("ok");
    expect(body.timestamp).toBeDefined();
    expect(typeof body.uptime).toBe("number");
    expect(next).not.toHaveBeenCalled();
  });

  it("calls next for non-health paths", () => {
    const req = createMockReq({ path: "/api/users" });
    const res = createMockRes();
    const next = vi.fn();

    healthCheckMiddleware(req, res, next);

    expect(next).toHaveBeenCalledOnce();
  });
});
