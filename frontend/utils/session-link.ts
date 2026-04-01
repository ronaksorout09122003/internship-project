const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SESSION_CODE_REGEX = /^[A-HJ-NP-Z2-9]{6,32}$/;
const UUID_IN_TEXT_REGEX =
  /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i;
const SESSION_CODE_LABEL_REGEX =
  /session\s*code\s*[:#-]?\s*([A-HJ-NP-Z2-9]{6,32})/i;
const URL_IN_TEXT_REGEX = /https?:\/\/[^\s]+/gi;

export type SessionJoinReference =
  | { sessionId: string }
  | { sessionCode: string };

export function extractSessionId(input: string) {
  const trimmed = input.trim();

  if (UUID_REGEX.test(trimmed)) {
    return trimmed;
  }

   const embeddedUuid = trimmed.match(UUID_IN_TEXT_REGEX)?.[0];
   if (embeddedUuid) {
     return embeddedUuid;
   }

  try {
    const url = new URL(trimmed);
    const parts = url.pathname.split("/").filter(Boolean);
    const candidate = parts.at(-1);
    return candidate && UUID_REGEX.test(candidate) ? candidate : null;
  } catch {
    for (const urlCandidate of trimmed.match(URL_IN_TEXT_REGEX) ?? []) {
      try {
        const url = new URL(urlCandidate);
        const candidate = url.pathname.split("/").filter(Boolean).at(-1);
        if (candidate && UUID_REGEX.test(candidate)) {
          return candidate;
        }
      } catch {
        // Ignore malformed URL fragments and keep searching.
      }
    }

    return null;
  }
}

export function extractSessionJoinReference(input: string): SessionJoinReference | null {
  const sessionId = extractSessionId(input);
  if (sessionId) {
    return { sessionId };
  }

  const trimmed = input.trim();
  const normalizedCode = trimmed.toUpperCase();
  if (SESSION_CODE_REGEX.test(normalizedCode)) {
    return { sessionCode: normalizedCode };
  }

  const labeledCode = trimmed.match(SESSION_CODE_LABEL_REGEX)?.[1]?.toUpperCase();
  if (labeledCode && SESSION_CODE_REGEX.test(labeledCode)) {
    return { sessionCode: labeledCode };
  }

  try {
    const url = new URL(trimmed);
    const candidate = url.pathname.split("/").filter(Boolean).at(-1)?.toUpperCase();
    if (candidate && SESSION_CODE_REGEX.test(candidate)) {
      return { sessionCode: candidate };
    }
  } catch {
    for (const urlCandidate of trimmed.match(URL_IN_TEXT_REGEX) ?? []) {
      try {
        const url = new URL(urlCandidate);
        const candidate = url.pathname.split("/").filter(Boolean).at(-1)?.toUpperCase();
        if (candidate && SESSION_CODE_REGEX.test(candidate)) {
          return { sessionCode: candidate };
        }
      } catch {
        // Ignore malformed URL fragments and keep searching.
      }
    }
  }

  return null;
}
