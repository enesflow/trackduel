// Spotify API helper

// Placeholder tokens; replace with actual providerRefreshToken and providerAccessToken
// Type for saved tracks response items
interface SpotifySavedTrack {
  added_at: string;
  track: any; // Replace 'any' with the Spotify Track object type if available
}

/**
 * Fetches the user's saved (favorited) tracks from Spotify.
 * Uses the providerAccessToken for authorization.
 */
export async function getUserFavoriteSongs(
  providerAccessToken: string,
): Promise<SpotifySavedTrack[]> {
  console.error("providerAccessToken:", providerAccessToken);
  const response = await fetch('https://api.spotify.com/v1/me/tracks?limit=50', {
    headers: {
      Authorization: `Bearer ${providerAccessToken}`,
    },
  });

  if (!response.ok) {
    console.error(`Spotify API error: ${response.status} ${response.statusText}`);
    // also give the body
    const errorBody = await response.text();
    console.error('Error body:', errorBody);
    throw new Error(`Spotify API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.items as SpotifySavedTrack[];
}
