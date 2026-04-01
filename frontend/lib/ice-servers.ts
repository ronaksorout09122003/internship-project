function splitCsv(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function buildIceServers(): RTCIceServer[] {
  const stunUrls = splitCsv(process.env.NEXT_PUBLIC_STUN_URLS);
  const turnUrls = splitCsv(process.env.NEXT_PUBLIC_TURN_URLS);
  const turnUsername = process.env.NEXT_PUBLIC_TURN_USERNAME?.trim();
  const turnCredential = process.env.NEXT_PUBLIC_TURN_CREDENTIAL?.trim();

  const servers: RTCIceServer[] = [];

  if (stunUrls.length > 0) {
    servers.push({ urls: stunUrls });
  }

  if (turnUrls.length > 0 && turnUsername && turnCredential) {
    servers.push({
      urls: turnUrls,
      username: turnUsername,
      credential: turnCredential
    });
  }

  if (servers.length === 0) {
    servers.push({
      urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"]
    });
  }

  return servers;
}
