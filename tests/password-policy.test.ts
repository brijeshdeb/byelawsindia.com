import { describe, expect, it } from "vitest";
import { validateNewPassword } from "@/lib/password-policy";

describe("password policy", () => {
  it("accepts a sufficiently strong password", () => {
    expect(validateNewPassword("StrongPassword1!")).toBeNull();
  });

  it("rejects short or incomplete passwords", () => {
    expect(validateNewPassword("Short1!")).toBe("Use at least 12 characters.");
    expect(validateNewPassword("longpasswordonly")).toBe(
      "Include uppercase, lowercase, a number and a symbol."
    );
  });
});
