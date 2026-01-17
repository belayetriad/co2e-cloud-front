import { getAccessToken, getRefreshToken, setAccessToken } from "@/utils/token";
import axios, { AxiosError, AxiosInstance } from "axios";

let isRefreshing = false;
let refreshQueue: Array<(token: string | null) => void> = [];

const apiRequest: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  withCredentials: false, // set true only if your API uses cookie auth

  headers: {
    "Content-Type": "application/json",
  },
  timeout: 20000,
});

apiRequest.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiRequest.interceptors.response.use(
  (res) => res,
  async (error: AxiosError<any>) => {
    const original = error.config as any;

    // If unauthorized, try refresh once
    if (error.response?.status === 401 && !original?._retry) {
      if (isRefreshing) {
        // wait until the current refresh completes
        return new Promise((resolve) => {
          refreshQueue.push((newToken) => {
            if (original.headers && newToken) {
              original.headers.Authorization = `Bearer ${newToken}`;
            }
            resolve(apiRequest(original));
          });
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const rt = getRefreshToken();
        if (!rt) throw new Error("No refresh token");

        const { data } = await axios.post(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/refresh`,
          { refreshToken: rt }
        );

        const newAccess = data?.accessToken as string | undefined;
        if (!newAccess) throw new Error("Invalid refresh payload");

        setAccessToken(newAccess);

        // flush queued requests
        refreshQueue.forEach((cb) => cb(newAccess));
        refreshQueue = [];

        if (original.headers) {
          original.headers.Authorization = `Bearer ${newAccess}`;
        }
        return apiRequest(original);
      } catch (e) {
        refreshQueue.forEach((cb) => cb(null));
        refreshQueue = [];
        // optional: redirect to /login here if desired
        return Promise.reject(e);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiRequest;
