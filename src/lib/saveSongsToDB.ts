import { adminDatabases, DatabaseInputSong } from '@/lib/appwriteAdmin';
import { ID, Permission, Role } from 'node-appwrite';

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

  // process in batches to limit concurrency
  const BATCH_SIZE = 20;
  let successCount = 0;

  for (let i = 0; i < songs.length; i += BATCH_SIZE) {
    const batch = songs.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map((song) =>
        adminDatabases.createDocument(
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
        )
      )
    );
    successCount += results.filter(r => r.status === 'fulfilled').length;
  }

  return successCount;
}