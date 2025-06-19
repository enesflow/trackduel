"use client";

import { databases } from "@/lib/appwrite";
import { DatabaseSong } from "@/lib/appwriteAdmin";
import { useLoggedInUser } from "@/lib/UserContext";
import { Query } from "appwrite";
import { useEffect, useState } from "react";

export default function SongsPage() {
  const user = useLoggedInUser();
  const [songs, setSongs] = useState<DatabaseSong[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    databases
      .listDocuments("db", "songs", [
        Query.equal("user_id", user.current.$id),
        Query.orderDesc("elo"),
        Query.limit(50),
      ])
      .then((res) => setSongs(res.documents as unknown as DatabaseSong[]))
      .finally(() => setLoading(false));
  }, [user.current]);

  return (
    <div>
      <h1>Your Songs</h1>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <ul>
          {songs.map((song) => (
            <li key={song.spotify_id}>
              {song.name} - {song.artists}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
