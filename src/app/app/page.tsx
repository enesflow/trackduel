"use client";

import { fetchNextJSAPIForSpotify } from "@/lib/spotify";
import { useLoggedInUser } from "@/lib/UserContext";
import { useState } from "react";

export default function HomePage() {
  const [songs, setSongs] = useState<string[]>([]);
  const user = useLoggedInUser();

  return (
    <div>
      <p>Welcome to the Home Page, {user.current?.name}!</p>
      <button onClick={() => user.logout()}>Logout</button>
      <br />

      <button
        onClick={async () => {
          const response = await fetchNextJSAPIForSpotify<void>(
            "save-songs-to-db",
            user
          );
          console.log("Response from save-songs-to-db:", response);
        }}
      >
        Save favorite songs to DB
      </button>
      <ul>
        {songs.map((song) => (
          <li key={song}>{song}</li>
        ))}
      </ul>
    </div>
  );
}
