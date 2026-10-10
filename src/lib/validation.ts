/**
 * Validation utilities for AisleAlly forms.
 * Framework-free — pure functions returning error strings or null.
 */

/**
 * Validate that a required field is not empty.
 * @param value - The field value to check
 * @param fieldName - Human-readable field name for the error message
 * @returns Error message string, or null if valid
 */
export function validateRequired(
  value: string,
  fieldName: string
): string | null {
  if (!value || value.trim().length === 0) {
    return `${fieldName} is required`;
  }
  return null;
}

/**
 * Validate an email address format.
 * @param email - The email string to check
 * @returns Error message string, or null if valid
 */
export function validateEmail(email: string): string | null {
  if (!email || email.trim().length === 0) {
    return "Email is required";
  }
  // Basic but sufficient email pattern for MVP
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return "Please enter a valid email address";
  }
  return null;
}

/**
 * Validate the full login form.
 * @returns An object with optional error messages keyed by field name.
 *          An empty object means the form is valid.
 */
export function validateLoginForm(
  email: string,
  password: string
): { email?: string; password?: string } {
  const errors: { email?: string; password?: string } = {};

  const emailError = validateEmail(email);
  if (emailError) errors.email = emailError;

  const passwordError = validateRequired(password, "Password");
  if (passwordError) errors.password = passwordError;

  return errors;
}

/**
 * Validate the full sign-up form.
 * @returns An object with optional error messages keyed by field name.
 *          An empty object means the form is valid.
 */
export function validateSignupForm(
  name: string,
  email: string,
  password: string
): { name?: string; email?: string; password?: string } {
  const errors: { name?: string; email?: string; password?: string } = {};

  const nameError = validateRequired(name, "Full name");
  if (nameError) errors.name = nameError;

  const emailError = validateEmail(email);
  if (emailError) errors.email = emailError;

  const passwordError = validateRequired(password, "Password");
  if (passwordError) errors.password = passwordError;

  return errors;
}
