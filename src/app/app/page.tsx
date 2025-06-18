"use client";

import { account } from "@/lib/appwrite";
import { useLoggedInUser } from "@/lib/UserContext";

export default function HomePage() {
  const user = useLoggedInUser();

  // Example: fetch favorite songs from Spotify API route and log the response
  async function handleLoadSongs() {
    try {
      const session = await user.getSession();
      // etc.
      const res = await fetch(
        new URL(
          `/api/spotify?providerAccessToken=${session?.providerAccessToken}`,
          window.location.origin
        )
      );
      const data = await res.json();
      console.log(
        "Favorite songs:",
        data.map((song) => song.track.name)
      );
    } catch (err) {
      console.error("Error loading favorite songs:", err);
    }
  }

  return (
    <div>
      <p>Welcome to the Home Page, {user.current?.name}!</p>
      <button onClick={() => user.logout()}>Logout</button>
      <button onClick={handleLoadSongs}>Load Favorite Songs</button>
    </div>
  );
}
