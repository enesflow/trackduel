import { fetchNextJSAPIWithToken } from '@/lib/fetch';
import { UserContextType } from "./UserContext";

/**
 * Makes a request to save songs from the user's music provider with the API token.
 *  @param user - The user context containing session and provider information.
 */
export async function saveSongs(
  user: UserContextType
) {
  const session = await user.getSession();
  if (!session || !session.provider) {
    throw new Error("User session is not valid or does not have a provider.");
  }
  const url = session.provider === "spotify"
    ? "/spotify/save-songs-to-db"
    : session.provider === "google"
      ? "/youtube/save-songs-to-db"
      : null;
  if (!url) {
    throw new Error("Unsupported provider for saving songs.");
  }
  return await fetchNextJSAPIWithToken<string[]>(
    url,
    user
  );
}
