export type ApiErrorBody = {
  error?: string;
  details?: unknown;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(message);
  }
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

let authToken: string | null = localStorage.getItem("auth.token");

export const setAuthToken = (token: string | null) => {
  authToken = token;

  if (token) {
    localStorage.setItem("auth.token", token);
  } else {
    localStorage.removeItem("auth.token");
  }
};

export const getAuthToken = () => authToken;

export const request = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const headers = new Headers(options.headers);

  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  if (authToken) {
    headers.set("Authorization", `Bearer ${authToken}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const body = (await response.json().catch(() => ({}))) as ApiErrorBody | T;

  if (!response.ok) {
    const errorBody = body as ApiErrorBody;
    throw new ApiError(errorBody.error ?? "Request failed", response.status, errorBody.details);
  }

  return body as T;
};
