/**
 * HTML sanitization utilities
 * Prevents XSS attacks in user-generated content
 */

/**
 * Escapes HTML special characters to prevent XSS
 * @param text - The text to escape
 * @returns Escaped text safe for HTML context
 */
export function escapeHtml(text: string): string {
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  
  return text.replace(/[&<>"']/g, (char) => htmlEscapes[char] || char);
}

/**
 * Sanitizes user input for safe display in HTML emails
 * @param input - The input string to sanitize
 * @returns Sanitized string
 */
export function sanitizeForEmail(input: string | null | undefined): string {
  if (!input) return '';
  return escapeHtml(input.trim());
}
