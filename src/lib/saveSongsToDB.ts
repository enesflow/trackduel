import { UserContextType } from "./UserContext";
import { fetchNextJSAPIWithToken } from '@/lib/fetch';

/**
 * Saves the user's songs to the database based on their authentication provider.
 *
 * This function retrieves the current user session and, if the provider is Spotify,
 * calls the Next.js API endpoint to save the user's songs to the database.
 * Throws an error if the session is invalid or if the provider is unsupported.
 *
 * @param user - The user context containing session and authentication information.
 * @returns A promise that resolves to an array of strings representing saved song identifiers.
 * @throws {Error} If the user session is invalid or the provider is unsupported.
 */
export async function saveSongsToDB(
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
  } else {
    throw new Error("Unsupported provider for saving songs.");
  }
}