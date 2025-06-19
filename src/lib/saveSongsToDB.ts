import { adminDatabases, DatabaseInputSong } from '@/lib/appwriteAdmin';
import { ID, Permission, Query, Role } from 'node-appwrite';

/**
 * THIS IS SUPPOSED TO BE CALLED ON THE SERVER. Saves an array of songs to the database for a specific user.
 *
 * Each song is stored as a new document in the "songs" collection, with permissions
 * set so that only the specified user can read, update, or delete their songs.
 * The function processes all songs concurrently and returns the count of successful saves.
 *
 * @param userID - The unique identifier of the user to associate the songs with.
 * @param songs - An array of song objects to be saved to the database.
 * @returns The number of songs successfully saved to the database.
 * @throws If no songs are provided in the input array.
 */
export async function saveSongsToDB(userID: string, songs: DatabaseInputSong[]) {
  if (!songs || songs.length === 0) {
    throw new Error("No songs provided to save to the database.");
  }

  // get user's current songs
  const currentSongs = await adminDatabases.listDocuments(
    "db",
    "songs",
    [Query.equal("user_id", userID)],
  );
  const currentSongProviderIDs = new Set(
    currentSongs.documents.map(song => song.provider_id),
  );

  const songsWithIDs = songs
    .filter(song => !currentSongProviderIDs.has(song.provider_id)) // Filter out songs that already exist
    .map(song => ({
      ...song,
      $id: ID.unique(),
    })) satisfies (DatabaseInputSong & { $id: string })[];
  try {
    const result = await adminDatabases.createDocument(
      "db",
      "batch",
      ID.unique(),
      {
        user_id: userID,
        songs: songsWithIDs,
      },
      [Permission.read(Role.user(userID)),
      Permission.update(Role.user(userID)),
      Permission.delete(Role.user(userID))],
    );
    return result.songs.length; // Return the number of songs saved
  } catch (error) {
    console.log("Error saving songs to DB:", error);
    throw new Error(`Failed to save songs to the database: ${error}`);
  }

}