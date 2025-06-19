import { getAuthorizationHeader } from "@/lib/authorizationHeader";
import { throwErrorIfNotOk } from "./throwErrorIfNotOk";

const SPOTIFY_API_BASE_URL = 'https://api.spotify.com/v1';

/**
 * This function should be called on the server. Fetches data from the Spotify Web API at the specified path using the provided access token.
 *
 * @template T - The expected response type.
 * @param path - The endpoint path to fetch from the Spotify API (relative to the base URL).
 * @param providerAccessToken - The OAuth access token used for authorization.
 * @returns A promise that resolves to the parsed JSON response of type `T`.
 * @throws Will throw an error if the response is not OK.
 */
export async function fetchSpotifyAPI<T>(
  path: string,
  providerAccessToken: string,
): Promise<T> {
  const response = await fetch(`${SPOTIFY_API_BASE_URL}${path}`, {
    headers: getAuthorizationHeader(providerAccessToken),
  });
  const okResponse = await throwErrorIfNotOk(response);
  return okResponse.json() as Promise<T>;
}