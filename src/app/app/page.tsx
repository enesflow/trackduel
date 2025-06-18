"use client";

import { getUserSavedSongs } from "@/lib/spotify";
import { useLoggedInUser } from "@/lib/UserContext";
import { useState } from "react";

export default function HomePage() {
  const [songs, setSongs] = useState<string[]>([]);
  const user = useLoggedInUser();

  // Example: fetch favorite songs from Spotify API route and log the response
  async function handleLoadSongs() {
    try {
      const session = await user.getSession();
      const data = await getUserSavedSongs(session?.providerAccessToken);
      setSongs(data.map((item: any) => item.track.name)); // Adjust based on actual data structure
    } catch (err) {
      console.error("Error loading favorite songs:", err);
    }
  }

  return (
    <div>
      <p>Welcome to the Home Page, {user.current?.name}!</p>
      <button onClick={() => user.logout()}>Logout</button>
      <button onClick={handleLoadSongs}>Load Favorite Songs</button>

      <ul>
        {songs.map((song) => (
          <li key={song}>{song}</li>
        ))}
      </ul>
    </div>
  );
}
