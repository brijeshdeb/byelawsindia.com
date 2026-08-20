export function validateNewPassword(password: string): string | null {
  if (password.length < 12) return "Use at least 12 characters.";
  if (
    !/[a-z]/.test(password) ||
    !/[A-Z]/.test(password) ||
    !/[0-9]/.test(password) ||
    !/[^A-Za-z0-9]/.test(password)
  ) {
    return "Include uppercase, lowercase, a number and a symbol.";
  }
  return null;
}
