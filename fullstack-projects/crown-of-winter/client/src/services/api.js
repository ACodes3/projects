
const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  "http://localhost:3000"
).replace(/\/+$/, "");

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.body != null
        ? { "Content-Type": "application/json" }
        : {}),
      ...options.headers,
    },
  });

  const result = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(
      result?.message || `Request failed (${response.status}).`,
      response.status
    );
  }

  return result;
}

export const authApi = {
  login(identifier, password) {
    return apiRequest("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ identifier, password }),
    });
  },

  register(username, email, password) {
    return apiRequest("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ username, email, password }),
    });
  },

  me() {
    return apiRequest("/api/auth/me");
  },

  logout() {
    return apiRequest("/api/auth/logout", {
      method: "POST",
    });
  },
};
