import { getAuthorizationHeader } from "@/lib/authorizationHeader";
import { throwErrorIfNotOk } from "./throwErrorIfNotOk";

const YOUTUBE_API_BASE_URL = 'https://www.googleapis.com/youtube/v3';

/**
 * This function should be called on the server. Fetches data from the YouTube Data API at the specified path using the provided access token.
 *
 * @template T - The expected response type.
 * @param path - The endpoint path to fetch from the YouTube API (relative to the base URL).
 * @param providerAccessToken - The OAuth access token used for authorization.
 * @returns A promise that resolves to the parsed JSON response of type `T`.
 * @throws Will throw an error if the response is not OK.
 */
export async function fetchYouTubeAPI<T>(
  path: string,
  providerAccessToken: string,
): Promise<T> {
  const response = await fetch(`${YOUTUBE_API_BASE_URL}${path}`, {
    headers: getAuthorizationHeader(providerAccessToken),
  });
  const okResponse = await throwErrorIfNotOk(response);
  return okResponse.json() as Promise<T>;
}

export function buildYoutubeEmbedUrl(videoId: string): string {
  // Constructs a YouTube embed URL with the given video ID.
  return `https://www.youtube.com/embed/${videoId}?enablejsapi=1&mute=1`;
}