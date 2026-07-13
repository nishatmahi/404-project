import axios from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  if (typeof window === "undefined") {
    return config;
  }

  const accessToken = window.localStorage.getItem("accessToken");
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status !== 401 ||
      originalRequest?._retry ||
      typeof window === "undefined"
    ) {
      return Promise.reject(error);
    }

    const refreshToken = window.localStorage.getItem("refreshToken");
    if (!refreshToken) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
        refresh: refreshToken,
      });
      window.localStorage.setItem("accessToken", response.data.access);
      originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
      return api(originalRequest);
    } catch (refreshError) {
      window.localStorage.removeItem("accessToken");
      window.localStorage.removeItem("refreshToken");
      return Promise.reject(refreshError);
    }
  },
);
