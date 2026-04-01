import { describe, expect, it } from "vitest";
import { getPasswordPolicyError, PASSWORD_POLICY_HINT } from "@/utils/password-policy";

describe("getPasswordPolicyError", () => {
  it("rejects empty passwords", () => {
    expect(getPasswordPolicyError("")).toBe("Password is required.");
  });

  it("rejects weak passwords", () => {
    expect(getPasswordPolicyError("password123")).toBe(PASSWORD_POLICY_HINT);
    expect(getPasswordPolicyError("Password123")).toBe(PASSWORD_POLICY_HINT);
  });

  it("accepts strong passwords", () => {
    expect(getPasswordPolicyError("Password123!")).toBeNull();
  });
});
