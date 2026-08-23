import { describe, expect, it } from "vitest";

describe("production CORS configuration", () => {
  it("allows the published admin dashboard origin on the health endpoint", async () => {
    const apiBaseUrl = process.env.CORS_TEST_API_URL || "http://127.0.0.1:3000";
    const apiUrl = `${apiBaseUrl.replace(/\/$/, "")}/api/health`;
    const origin = "https://msgatewayadm-4pkhhml8.manus.space";

    const response = await fetch(apiUrl, {
      headers: { Origin: origin },
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("access-control-allow-origin")).toBe(origin);
    expect(response.headers.get("access-control-allow-credentials")).toBe("true");

    const payload = (await response.json()) as { ok?: boolean };
    expect(payload.ok).toBe(true);
  }, 30_000);
});
