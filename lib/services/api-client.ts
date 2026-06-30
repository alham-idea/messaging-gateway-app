import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

/**
 * Creates an authenticated fetch wrapper that automatically attaches
 * the stored auth token and handles common response errors.
 */
async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await AsyncStorage.getItem("auth_token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

/**
 * Performs an authenticated GET request.
 */
export async function apiGet<T>(path: string, params?: Record<string, string>): Promise<T> {
  const headers = await getAuthHeaders();
  const url = new URL(path, API_BASE_URL);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  const response = await fetch(url.toString(), { headers });
  if (!response.ok) {
    throw new ApiRequestError(
      `Request failed: ${response.statusText}`,
      response.status,
    );
  }
  return response.json();
}

/**
 * Performs an authenticated POST request.
 */
export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const headers = await getAuthHeaders();
  const url = new URL(path, API_BASE_URL);

  const response = await fetch(url.toString(), {
    method: "POST",
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) {
    throw new ApiRequestError(
      `Request failed: ${response.statusText}`,
      response.status,
    );
  }
  return response.json();
}
