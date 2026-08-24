import { describe, expect, it } from "vitest";
import { normalizeSmsPhoneNumber } from "../lib/services/sms-validation";

describe("SMS validation", () => {
  it("normalizes common Saudi phone formatting", () => {
    expect(normalizeSmsPhoneNumber("+966 50-123-4567")).toBe("+966501234567");
  });

  it("accepts international E.164-like numbers", () => {
    expect(normalizeSmsPhoneNumber("201012345678")).toBe("201012345678");
  });

  it("rejects malformed, empty, and overlong numbers", () => {
    expect(normalizeSmsPhoneNumber("")).toBeNull();
    expect(normalizeSmsPhoneNumber("0501234567")).toBeNull();
    expect(normalizeSmsPhoneNumber("+123")).toBeNull();
    expect(normalizeSmsPhoneNumber("+12345678901234567")).toBeNull();
  });
});
