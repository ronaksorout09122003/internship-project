const PASSWORD_POLICY_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,100}$/;

export const PASSWORD_POLICY_HINT =
  "Use 8-100 characters with uppercase, lowercase, a number, and a special character.";

export function getPasswordPolicyError(password: string) {
  if (!password) {
    return "Password is required.";
  }

  if (!PASSWORD_POLICY_REGEX.test(password)) {
    return PASSWORD_POLICY_HINT;
  }

  return null;
}
