import { describe, expect, it } from "vitest";
import { extractSessionId, extractSessionJoinReference } from "@/utils/session-link";

describe("extractSessionId", () => {
  it("returns a raw uuid when provided directly", () => {
    expect(extractSessionId("123e4567-e89b-12d3-a456-426614174000")).toBe(
      "123e4567-e89b-12d3-a456-426614174000"
    );
  });

  it("extracts a uuid from a session URL", () => {
    expect(
      extractSessionId("http://localhost:3000/sessions/123e4567-e89b-12d3-a456-426614174000")
    ).toBe("123e4567-e89b-12d3-a456-426614174000");
  });

  it("returns null for invalid input", () => {
    expect(extractSessionId("not-a-session-link")).toBeNull();
  });
});

describe("extractSessionJoinReference", () => {
  it("keeps uuid-based room links working", () => {
    expect(
      extractSessionJoinReference(
        "http://localhost:3000/sessions/123e4567-e89b-12d3-a456-426614174000"
      )
    ).toEqual({
      sessionId: "123e4567-e89b-12d3-a456-426614174000"
    });
  });

  it("normalizes a session code", () => {
    expect(extractSessionJoinReference("park23ab")).toEqual({
      sessionCode: "PARK23AB"
    });
  });

  it("extracts a joinable room from the copied room message", () => {
    expect(
      extractSessionJoinReference(
        "http://localhost:3000/sessions/123e4567-e89b-12d3-a456-426614174000\nSession code: PARK23AB"
      )
    ).toEqual({
      sessionId: "123e4567-e89b-12d3-a456-426614174000"
    });
  });

  it("extracts a labeled session code from pasted helper text", () => {
    expect(
      extractSessionJoinReference("Join with this invite. Session code: WZWDBQCF")
    ).toEqual({
      sessionCode: "WZWDBQCF"
    });
  });

  it("returns null for unrelated text", () => {
    expect(extractSessionJoinReference("join my room please")).toBeNull();
  });
});
