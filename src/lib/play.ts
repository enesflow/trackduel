import { SongsContextType } from '@/lib/SongsContext';

import { databases } from '@/lib/appwrite';

// This can happen if a song is added both from Spotify and YouTube Music
// remove the song with the lower ELO
export function deleteSongWithLowerELO(songsCtx: SongsContextType, indices: [number, number]) {
  // Keep the first song, delete the second
  let [firstIndex, secondIndex] = indices;
  if (songsCtx.songs[firstIndex].elo < songsCtx.songs[secondIndex].elo) {
    [firstIndex, secondIndex] = [secondIndex, firstIndex];
  }
  // Now the second song is always the one with the lower ELO
  const songToKeep = songsCtx.songs[firstIndex];
  const songToDelete = songsCtx.songs[secondIndex];

  const newSongs = [...songsCtx.songs];
  newSongs.splice(secondIndex, 1); // Remove the second song
  songsCtx.setSongs(newSongs);

  return {
    promise: (async () => {
      await databases.deleteDocument("db", "songs", songToDelete.$id);
    })(),
    newSongs: newSongs,
  }
}