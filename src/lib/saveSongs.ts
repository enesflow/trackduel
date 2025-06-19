import { UserContextType } from "./UserContext";
import { fetchNextJSAPIWithToken } from '@/lib/fetch';
import { adminDatabases, DatabaseInputSong } from '@/lib/appwriteAdmin';
import { ID, Permission, Role } from "node-appwrite";

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

export async function saveSongsToDB(userID: string, songs: DatabaseInputSong[]) {
  if (!songs || songs.length === 0) {
    throw new Error("No songs provided to save to the database.");
  }

  const results = await Promise.allSettled(
    songs.map((song) => {
      return adminDatabases.createDocument(
        "db",
        "songs",
        ID.unique(),
        {
          ...song,
          user_id: userID,
        },
        [
          Permission.read(Role.user(userID)),
          Permission.update(Role.user(userID)),
          Permission.delete(Role.user(userID)),
        ],
      );
    })
  );

  const successCount = results.filter(result => result.status === 'fulfilled').length;
  return successCount;
}