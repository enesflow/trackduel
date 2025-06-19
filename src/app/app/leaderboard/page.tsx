"use client";

import { useSongs } from "@/lib/SongsContext";

export default function SongsPage() {
  const { songs, loading } = useSongs();

  return (
    <div>
      <h1>Your Songs</h1>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <ul>
          {songs.map((song) => (
            <li key={song.spotify_id}>
              {song.name} - {song.artists} / ({song.elo})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
