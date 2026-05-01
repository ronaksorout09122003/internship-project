export interface RuntimeConfig {
  apiBaseUrl: string;
  wsUrl: string;
  stunUrls: string[];
  turnUrls: string[];
  turnUsername: string;
  turnCredential: string;
}

declare global {
  interface Window {
    __MENTORA_RUNTIME_CONFIG__?: RuntimeConfig;
    __MENTORA_RUNTIME_CONFIG_PROMISE__?: Promise<RuntimeConfig>;
  }
}

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function splitCsv(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function getFallbackBackendOrigin() {
  const explicitOrigin = process.env.NEXT_PUBLIC_BACKEND_ORIGIN?.trim();
  if (explicitOrigin) {
    return trimTrailingSlash(explicitOrigin);
  }

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (apiBaseUrl) {
    return trimTrailingSlash(apiBaseUrl.replace(/\/api\/?$/, ""));
  }

  const wsUrl = process.env.NEXT_PUBLIC_WS_URL?.trim();
  if (wsUrl) {
    return trimTrailingSlash(wsUrl.replace(/\/ws\/?$/, ""));
  }

  return "http://localhost:8080";
}

function buildFallbackConfig(): RuntimeConfig {
  const backendOrigin = getFallbackBackendOrigin();
  const stunUrls = splitCsv(process.env.NEXT_PUBLIC_STUN_URLS);

  return {
    apiBaseUrl: `${backendOrigin}/api`,
    wsUrl: `${backendOrigin}/ws`,
    stunUrls: stunUrls.length
      ? stunUrls
      : ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"],
    turnUrls: splitCsv(process.env.NEXT_PUBLIC_TURN_URLS),
    turnUsername: process.env.NEXT_PUBLIC_TURN_USERNAME?.trim() || "",
    turnCredential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL?.trim() || ""
  };
}

export function getRuntimeConfigSync() {
  if (typeof window !== "undefined" && window.__MENTORA_RUNTIME_CONFIG__) {
    return window.__MENTORA_RUNTIME_CONFIG__;
  }

  return buildFallbackConfig();
}

export async function getRuntimeConfig() {
  if (typeof window === "undefined") {
    return buildFallbackConfig();
  }

  if (window.__MENTORA_RUNTIME_CONFIG__) {
    return window.__MENTORA_RUNTIME_CONFIG__;
  }

  if (!window.__MENTORA_RUNTIME_CONFIG_PROMISE__) {
    window.__MENTORA_RUNTIME_CONFIG_PROMISE__ = fetch("/api/runtime-config", {
      cache: "no-store"
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Unable to load runtime config.");
        }

        const runtimeConfig = (await response.json()) as RuntimeConfig;
        window.__MENTORA_RUNTIME_CONFIG__ = runtimeConfig;
        return runtimeConfig;
      })
      .catch(() => {
        const fallbackConfig = buildFallbackConfig();
        window.__MENTORA_RUNTIME_CONFIG__ = fallbackConfig;
        return fallbackConfig;
      });
  }

  return window.__MENTORA_RUNTIME_CONFIG_PROMISE__;
}
