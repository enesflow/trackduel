/**
 * Generates the HTTP headers required for authorized requests to the Spotify API.
 *
 * @param token - The OAuth access token to be included in the Authorization header.
 * @returns An object containing the Authorization and Content-Type headers.
 */
export function getAuthorizationHeader(token: string, type: "Bearer" | "Basic" | "Session" = "Bearer"): Record<string, string> {
  if (!token) {
    throw new Error("Token is required for authorization header");
  }
  return {
    'Authorization': `${type} ${token || ''}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Extracts the Bearer token from the Authorization header of a given Headers object.
 *
 * @param headers - The Headers object containing the Authorization header.
 * @returns The extracted Bearer token as a string if present, otherwise `null`.
 */
export function getTokenFromAuthHeader(headers: Headers): { type: string; token: string } | null {
  const authHeader = headers.get('Authorization');
  if (!authHeader) {
    return null;
  }
  // Match "Bearer <token>", "Basic <token>", or "Session <token>"
  const match = authHeader.match(/^(Bearer|Basic|Session)\s+(.+)$/i);
  if (!match) {
    return null;
  }
  return { type: match[1], token: match[2] };
}