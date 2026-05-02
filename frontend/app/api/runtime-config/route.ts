import { NextResponse } from "next/server";

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function splitCsv(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function getBackendOrigin() {
  const explicitOrigin = process.env.BACKEND_ORIGIN?.trim();
  if (explicitOrigin) {
    return trimTrailingSlash(explicitOrigin);
  }

  const publicOrigin = process.env.NEXT_PUBLIC_BACKEND_ORIGIN?.trim();
  if (publicOrigin) {
    return trimTrailingSlash(publicOrigin);
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

export async function GET() {
  const backendOrigin = getBackendOrigin();

  return NextResponse.json(
    {
      apiBaseUrl: `${backendOrigin}/api`,
      wsUrl: `${backendOrigin}/ws`,
      stunUrls: splitCsv(process.env.NEXT_PUBLIC_STUN_URLS).length
        ? splitCsv(process.env.NEXT_PUBLIC_STUN_URLS)
        : ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"],
      turnUrls: splitCsv(process.env.NEXT_PUBLIC_TURN_URLS),
      turnUsername: process.env.NEXT_PUBLIC_TURN_USERNAME?.trim() || "",
      turnCredential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL?.trim() || ""
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0"
      }
    }
  );
}
