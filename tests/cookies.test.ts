import { describe, it, expect } from "vitest";
import { getSessionCookieOptions } from "../server/_core/cookies";
import type { Request } from "express";

function fakeReq(overrides: {
  hostname?: string;
  protocol?: string;
  headers?: Record<string, string | string[]>;
}): Request {
  return {
    hostname: overrides.hostname ?? "localhost",
    protocol: overrides.protocol ?? "http",
    headers: overrides.headers ?? {},
  } as unknown as Request;
}

describe("getSessionCookieOptions", () => {
  // --- secure flag ---
  it("sets secure=true when protocol is https", () => {
    const opts = getSessionCookieOptions(fakeReq({ protocol: "https" }));
    expect(opts.secure).toBe(true);
  });

  it("sets secure=false for plain http without forwarded proto", () => {
    const opts = getSessionCookieOptions(fakeReq({ protocol: "http" }));
    expect(opts.secure).toBe(false);
  });

  it("sets secure=true when x-forwarded-proto header is https", () => {
    const opts = getSessionCookieOptions(
      fakeReq({ protocol: "http", headers: { "x-forwarded-proto": "https" } }),
    );
    expect(opts.secure).toBe(true);
  });

  it("handles comma-separated x-forwarded-proto containing https", () => {
    const opts = getSessionCookieOptions(
      fakeReq({
        protocol: "http",
        headers: { "x-forwarded-proto": "http, https" },
      }),
    );
    expect(opts.secure).toBe(true);
  });

  it("handles array x-forwarded-proto", () => {
    const opts = getSessionCookieOptions(
      fakeReq({
        protocol: "http",
        headers: { "x-forwarded-proto": ["https"] as unknown as string },
      }),
    );
    expect(opts.secure).toBe(true);
  });

  // --- domain ---
  it("returns undefined domain for localhost", () => {
    const opts = getSessionCookieOptions(fakeReq({ hostname: "localhost" }));
    expect(opts.domain).toBeUndefined();
  });

  it("returns undefined domain for 127.0.0.1", () => {
    const opts = getSessionCookieOptions(fakeReq({ hostname: "127.0.0.1" }));
    expect(opts.domain).toBeUndefined();
  });

  it("returns undefined domain for ::1", () => {
    const opts = getSessionCookieOptions(fakeReq({ hostname: "::1" }));
    expect(opts.domain).toBeUndefined();
  });

  it("returns undefined domain for an IPv4 address", () => {
    const opts = getSessionCookieOptions(fakeReq({ hostname: "192.168.1.1" }));
    expect(opts.domain).toBeUndefined();
  });

  it("returns undefined domain for a two-part hostname", () => {
    const opts = getSessionCookieOptions(fakeReq({ hostname: "example.com" }));
    expect(opts.domain).toBeUndefined();
  });

  it("returns parent domain for a three-part hostname", () => {
    const opts = getSessionCookieOptions(
      fakeReq({ hostname: "3000-xxx.manuspre.computer" }),
    );
    expect(opts.domain).toBe(".manuspre.computer");
  });

  it("returns parent domain for a deeply-nested hostname", () => {
    const opts = getSessionCookieOptions(
      fakeReq({ hostname: "a.b.c.example.com" }),
    );
    expect(opts.domain).toBe(".example.com");
  });

  // --- static fields ---
  it("always sets httpOnly, path, and sameSite", () => {
    const opts = getSessionCookieOptions(fakeReq({}));
    expect(opts.httpOnly).toBe(true);
    expect(opts.path).toBe("/");
    expect(opts.sameSite).toBe("none");
  });
});
