import { describe, it, expect } from "vitest";
import {
  HttpError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
} from "../shared/_core/errors";

describe("HttpError", () => {
  it("stores statusCode and message", () => {
    const err = new HttpError(422, "Unprocessable");
    expect(err.statusCode).toBe(422);
    expect(err.message).toBe("Unprocessable");
    expect(err.name).toBe("HttpError");
  });

  it("is an instance of Error", () => {
    const err = new HttpError(500, "Internal");
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(HttpError);
  });
});

describe("convenience constructors", () => {
  it("BadRequestError creates a 400 HttpError", () => {
    const err = BadRequestError("bad input");
    expect(err).toBeInstanceOf(HttpError);
    expect(err.statusCode).toBe(400);
    expect(err.message).toBe("bad input");
  });

  it("UnauthorizedError creates a 401 HttpError", () => {
    const err = UnauthorizedError("not logged in");
    expect(err.statusCode).toBe(401);
    expect(err.message).toBe("not logged in");
  });

  it("ForbiddenError creates a 403 HttpError", () => {
    const err = ForbiddenError("no access");
    expect(err.statusCode).toBe(403);
    expect(err.message).toBe("no access");
  });

  it("NotFoundError creates a 404 HttpError", () => {
    const err = NotFoundError("missing resource");
    expect(err.statusCode).toBe(404);
    expect(err.message).toBe("missing resource");
  });
});
