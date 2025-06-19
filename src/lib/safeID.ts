/**
 * Generates a unique, deterministic hash string based on the current timestamp and the provided input object.
 * Utilizes the Web Crypto API to create a SHA-1 hash, and returns the first 20 hexadecimal characters.
 *
 * @param input - An object to be included in the hash generation. It will be stringified using JSON.stringify.
 * @returns A promise that resolves to a 20-character hexadecimal string representing the unique hash.
 */
async function unique(input: {}) {
  const timestamp = Date.now();
  const baseString = `${timestamp}${JSON.stringify(input)}`;

  // Use Web Crypto API for hashing
  const encoder = new TextEncoder();
  const data = encoder.encode(baseString);

  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex.substring(0, 20);
}

export const safeID = {
  unique,
}