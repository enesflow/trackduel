/**
 * Throws an error if the provided `Response` object is not OK (i.e., `response.ok` is `false`).
 * Logs the error details, including status, status text, and response body, to the console.
 *
 * @param response - The `Response` object to check.
 * @returns The same `Response` object, narrowed to `{ ok: true }`, if the response is OK.
 * @throws {Error} If the response is not OK, with a message containing the status and status text.
 */
export async function throwErrorIfNotOk(response: Response): Promise<Response & { ok: true; }> {
  if (!response.ok) {
    const errorBody = await response.text();
    console.error("ERROR ON PATH:", response.url);
    console.error('Spotify API error:', response.status, response.statusText, errorBody);
    throw new Error(`Spotify API error: ${response.status} ${response.statusText}`);
  }
  return response as Response & { ok: true; };
}
