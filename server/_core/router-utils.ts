import { TRPCError } from "@trpc/server";
import type { TRPC_ERROR_CODE_KEY } from "@trpc/server/unstable-core-do-not-import";

/**
 * Wraps an async handler so that TRPCErrors are re-thrown as-is while
 * any other error becomes INTERNAL_SERVER_ERROR with the given fallback message.
 */
export async function trpcHandler<T>(
  fn: () => Promise<T>,
  fallbackMessage: string,
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof TRPCError) throw error;
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: fallbackMessage,
    });
  }
}

/**
 * Throws UNAUTHORIZED if the user is not an admin or super_admin.
 */
export function requireAdmin(ctx: { user?: { role?: string } | null }, action?: string): void {
  if (ctx.user?.role !== "admin" && (ctx.user?.role as string) !== "super_admin") {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: action
        ? `Only admins can ${action}`
        : "Admin access required",
    });
  }
}

/**
 * Fetches a resource by ID and throws NOT_FOUND if it doesn't exist.
 */
export async function findOrThrow<T>(
  fetcher: () => Promise<T | null | undefined>,
  resourceName: string,
  code: TRPC_ERROR_CODE_KEY = "NOT_FOUND",
): Promise<T> {
  const result = await fetcher();
  if (!result) {
    throw new TRPCError({
      code,
      message: `${resourceName} not found`,
    });
  }
  return result;
}

/**
 * Verifies that a resource belongs to the given user; throws if not.
 */
export function verifyOwnership(
  resource: { userId: number } | null | undefined,
  userId: number,
  resourceName: string,
): asserts resource is { userId: number } {
  if (!resource || resource.userId !== userId) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: `${resourceName} not found`,
    });
  }
}

export interface PaginationInput {
  limit: number;
  offset: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Applies in-memory pagination (offset/limit) to an array and returns a
 * standardized paginated response.
 */
export function paginate<T>(
  items: T[],
  { limit, offset }: PaginationInput,
): PaginatedResult<T> {
  const total = items.length;
  const page = items.slice(offset, offset + limit);
  return { items: page, total, limit, offset };
}
