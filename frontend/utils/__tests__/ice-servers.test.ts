import { afterEach, describe, expect, it } from "vitest";
import { buildIceServers } from "@/lib/ice-servers";

const originalEnv = {
  stun: process.env.NEXT_PUBLIC_STUN_URLS,
  turnUrls: process.env.NEXT_PUBLIC_TURN_URLS,
  turnUser: process.env.NEXT_PUBLIC_TURN_USERNAME,
  turnCredential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL
};

afterEach(() => {
  process.env.NEXT_PUBLIC_STUN_URLS = originalEnv.stun;
  process.env.NEXT_PUBLIC_TURN_URLS = originalEnv.turnUrls;
  process.env.NEXT_PUBLIC_TURN_USERNAME = originalEnv.turnUser;
  process.env.NEXT_PUBLIC_TURN_CREDENTIAL = originalEnv.turnCredential;
});

describe("buildIceServers", () => {
  it("uses default public STUN servers when no env vars are set", () => {
    process.env.NEXT_PUBLIC_STUN_URLS = "";
    process.env.NEXT_PUBLIC_TURN_URLS = "";
    process.env.NEXT_PUBLIC_TURN_USERNAME = "";
    process.env.NEXT_PUBLIC_TURN_CREDENTIAL = "";

    expect(buildIceServers()).toEqual([
      {
        urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"]
      }
    ]);
  });

  it("adds TURN servers when full credentials are available", () => {
    process.env.NEXT_PUBLIC_STUN_URLS = "stun:example.org:3478";
    process.env.NEXT_PUBLIC_TURN_URLS = "turn:turn.example.org:3478";
    process.env.NEXT_PUBLIC_TURN_USERNAME = "mentor";
    process.env.NEXT_PUBLIC_TURN_CREDENTIAL = "secret";

    expect(buildIceServers()).toEqual([
      {
        urls: ["stun:example.org:3478"]
      },
      {
        urls: ["turn:turn.example.org:3478"],
        username: "mentor",
        credential: "secret"
      }
    ]);
  });
});
