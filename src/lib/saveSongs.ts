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
  if (session.provider === "spotify") {
    return await fetchNextJSAPIWithToken<string[]>(
      "/spotify/save-songs-to-db",
      user
    );
  }
  else if (session.provider === "google") {
    return await fetchNextJSAPIWithToken<string[]>(
      "/youtube/save-songs-to-db",
      user
    );
  }
  else {
    throw new Error("Unsupported provider for saving songs.");
  }
}
