"use client";

import { Button } from "@/components/ui/button";
import { databases } from "@/lib/appwrite";
import { DatabaseSong } from "@/lib/appwriteAdmin";
import { useLoggedInUser } from "@/lib/UserContext";
import { Query } from "appwrite";
import { useEffect, useState } from "react";

export default function PlayPage() {
  const user = useLoggedInUser();
  // THIS IS A NAIVE IMPLEMENTATION PLEASE FIX THIS
  const [songs, setSongs] = useState<DatabaseSong[]>([]);
  const [pickedSongs, setPickedSongs] = useState<[number, number] | []>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    databases
      .listDocuments("db", "songs", [
        Query.equal("user_id", user.current.$id),
        Query.orderDesc("elo"),
        Query.limit(50),
      ])
      .then((res) => {
        setSongs(res.documents as unknown as DatabaseSong[]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user.current]);

  useEffect(() => {
    if (!loading && songs.length >= 2) {
      pickTwoRandomSongs();
    }
  }, [loading]);

  function pickTwoRandomSongs() {
    if (songs.length < 2) return;
    // shuffle indices via Fisher–Yates and pick the first two
    const indices = songs.map((_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    setPickedSongs([indices[0], indices[1]]);
  }

  async function win(who: "first" | "second") {
    // this will update the elo of the songs
    if (pickedSongs.length < 2) return;
    const firstSong = songs[pickedSongs[0]!];
    const secondSong = songs[pickedSongs[1]!];
    // using the formula: ELO = ELO + K * (S - E)
    const K = 32; // K-factor for ELO calculation
    const expectedFirst =
      1 / (1 + Math.pow(10, (secondSong.elo - firstSong.elo) / 400));
    const expectedSecond =
      1 / (1 + Math.pow(10, (firstSong.elo - secondSong.elo) / 400));
    let newFirstElo =
      firstSong.elo +
      K * (who === "first" ? 1 - expectedFirst : 0 - expectedFirst);
    let newSecondElo =
      secondSong.elo +
      K * (who === "second" ? 1 - expectedSecond : 0 - expectedSecond);
    newFirstElo = Math.max(newFirstElo, 100); // ELO should not go below 100
    newSecondElo = Math.max(newSecondElo, 100); // ELO should not go below 100
    Promise.allSettled([
      databases.updateDocument("db", "songs", firstSong.$id, {
        elo: newFirstElo,
      }),
      databases.updateDocument("db", "songs", secondSong.$id, {
        elo: newSecondElo,
      }),
    ]).then((results) => {
      songs[pickedSongs[0]!].elo = newFirstElo;
      songs[pickedSongs[1]!].elo = newSecondElo;
      setSongs([...songs]);
      pickTwoRandomSongs();
    });
  }

  return (
    <div>
      <h1>Play Songs</h1>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div>
          <div>
            <strong>Pick the better song:</strong>
            <div>
              {songs[pickedSongs[0]!]?.name} - {songs[pickedSongs[0]!]?.artists}
              <Button
                onClick={() => win("first")}
                style={{ marginLeft: "10px" }}
              >
                This one
              </Button>
            </div>
            <br />
            <div>
              {songs[pickedSongs[1]!]?.name} - {songs[pickedSongs[1]!]?.artists}
              <Button
                onClick={() => win("second")}
                style={{ marginLeft: "10px" }}
              >
                This one
              </Button>
            </div>
          </div>
          <br />
          <Button onClick={pickTwoRandomSongs}>Pick New Songs</Button>
        </div>
      )}
    </div>
  );
}
