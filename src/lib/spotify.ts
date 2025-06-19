import { getAuthorizationHeader } from "@/lib/authorizationHeader";
import { account } from "./appwrite";
import { throwErrorIfNotOk } from "./throwErrorIfNotOk";
import { UserContextType } from "./UserContext";

const SPOTIFY_API_BASE_URL = 'https://api.spotify.com/v1';

/**
 * This function should be called on the client. Fetches data from a Next.js API route for Spotify, handling session token refresh if necessary.
 *
 * @template T - The expected response type.
 * @param name - The name of the Spotify API endpoint to call (used in the route `/api/spotify/${name}`).
 * @param session - The current user session, which may contain the Spotify provider access token and its expiry.
 * @returns A promise that resolves to the response data parsed as type `T`.
 * @throws Will throw an error if the fetch response is not OK.
 */
export async function fetchNextJSAPIForSpotify<T>(
  name: string,
  userContext: UserContextType | null
): Promise<T> {
  if (!userContext || !userContext.current) {
    throw new Error("User context is required to fetch Spotify API data.");
  }
  let session = await userContext.getSession();
  if (!session?.providerAccessTokenExpiry) {
    throw new Error("Session does not have a valid provider access token expiry.");
  }
  const tokenExpiry = session.providerAccessTokenExpiry;
  // Ensure at least 60 seconds remain before token expiry
  if (!tokenExpiry || (new Date(tokenExpiry).getTime() - Date.now()) < 60 * 1000) {
    session = await account.updateSession("current");
  }
  const response = await fetch(`/api/spotify/${name}`, {
    headers: {
      ...getAuthorizationHeader(session.providerAccessToken),
      userID: userContext.current.$id,
    },
  });
  const okResponse = await throwErrorIfNotOk(response);
  return okResponse.json() as Promise<T>;
}


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