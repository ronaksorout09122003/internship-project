import axios from "axios";
import { getRuntimeConfig } from "@/lib/runtime-config";
import { getStoredToken } from "@/utils/storage";

export const apiClient = axios.create({
  headers: {
    "Content-Type": "application/json"
  }
});

apiClient.interceptors.request.use(async (config) => {
  const runtimeConfig = await getRuntimeConfig();
  config.baseURL = runtimeConfig.apiBaseUrl;

  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
