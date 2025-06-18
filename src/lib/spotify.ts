import { SpotifyPlaylist } from "@/types/spotify";

export async function fetchNextJSAPIForSpotify<T>(
  name: string,
  providerAccessToken: string,
): Promise<T> {
  const response = await fetch(`/api/spotify/${name}?providerAccessToken=${providerAccessToken}`, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    console.error(`Spotify API error: ${response.status} ${response.statusText}`);
    // also give the body
    const errorBody = await response.text();
    console.error('Error body:', errorBody);
    throw new Error(`Spotify API error: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

/**
 * Fetches the user's saved (favorited) tracks from Spotify.
 * Uses the providerAccessToken for authorization.
 */
export async function getUserSavedSongs(
  providerAccessToken?: string,
): Promise<SpotifyPlaylist> {
  if (!providerAccessToken) {
    throw new Error("Missing providerAccessToken");
  }
  return await fetchNextJSAPIForSpotify<SpotifyPlaylist>("saved", providerAccessToken);
}
