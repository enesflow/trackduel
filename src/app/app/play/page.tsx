"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { Music, Check, Shuffle, Trash, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/sonner";

// --- new imports for database and user context ---
import { databases } from "@/lib/appwrite";
import { DatabaseSong } from "@/lib/appwriteAdmin";
import { useSongs } from "@/lib/SongsContext";
// -------------------------------------------------

export default function PlayPage() {
  const { toast } = useToast();
  const { songs, setSongs, loading } = useSongs();
  const [pickedSongs, setPickedSongs] = useState<[number, number] | []>([]);
  // Track pending deletions for undo support via ref
  const pendingDeletions = useRef<
    Record<string, { song: DatabaseSong; index: number; timerId: number }>
  >({});
  // ----------------------------------------------

  // pick two random songs after loading
  useEffect(() => {
    if (!loading && songs.length >= 2) {
      pickTwoRandomSongs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  // Helper: pick two indices from a song list, optionally keeping one fixed
  function pickTwoSongs(
    songList: DatabaseSong[],
    fixedIdx: number | null = null
  ): [number, number] | [] {
    const indices: number[] = songList.map((_, i) => i);
    if (indices.length < 2) return [];
    if (fixedIdx === null) {
      // Pick two random indices
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }
      return [indices[0], indices[1]];
    } else {
      // Pick one random index that isn't fixedIdx
      const available: number[] = indices.filter((i) => i !== fixedIdx);
      if (available.length === 0) return [];
      const newIdx = available[Math.floor(Math.random() * available.length)];
      // Preserve order: fixedIdx first if it was first, else second
      return [fixedIdx, newIdx];
    }
  }

  // Helper: replace deleted song in picked pair
  function replaceDeletedPickedSong(
    oldSongs: DatabaseSong[],
    newSongs: DatabaseSong[],
    picked: [number, number] | [],
    deletedSongId: string
  ): [number, number] | [] {
    if (picked.length !== 2) return [];
    const deletedIdx = oldSongs.findIndex((song) => song.$id === deletedSongId);
    if (deletedIdx === -1) return [];
    const idxInPair = picked.indexOf(deletedIdx);
    if (idxInPair === -1) return [];
    const otherIdxOld = picked[1 - idxInPair];
    const otherSongId = oldSongs[otherIdxOld]?.$id;
    const otherIdxNew = newSongs.findIndex((song) => song.$id === otherSongId);
    if (otherIdxNew === -1) return [];
    // Pick a new song keeping the otherIdx fixed
    const newPair = pickTwoSongs(newSongs, otherIdxNew);
    // If deleted was at position 0, swap to keep the other song at original position 1
    return idxInPair === 0
      ? ([newPair[1], newPair[0]] as [number, number])
      : newPair;
  }

  function pickTwoRandomSongs() {
    setPickedSongs(pickTwoSongs(songs));
  }

  // Undo a pending deletion
  function undoDelete(songId: string) {
    console.log("Undoing deletion for song:", songId);
    const pending = pendingDeletions.current[songId];
    if (!pending) return;
    clearTimeout(pending.timerId);
    // remove from pending
    delete pendingDeletions.current[songId];
    setSongs((prev) => {
      const arr = [...prev];
      arr.splice(pending.index, 0, pending.song);
      return arr;
    });
    toast.success(
      <div>
        <div className="font-bold">Undo successful</div>
        <div>The song “{pending.song.name}” has been restored.</div>
      </div>
    );
  }

  async function win(who: "first" | "second", boosted: boolean = false) {
    if (pickedSongs.length < 2) return;
    const [firstIdx, secondIdx] = pickedSongs;
    const firstSong = songs[firstIdx!];
    const secondSong = songs[secondIdx!];
    const K = boosted ? 64 : 32; // Double the K if boosted

    const expected = (a: number, b: number) =>
      1 / (1 + Math.pow(10, (b - a) / 400));

    const expectedFirst = expected(firstSong.elo, secondSong.elo);
    const expectedSecond = expected(secondSong.elo, firstSong.elo);

    const newFirstElo = Math.max(
      firstSong.elo + K * ((who === "first" ? 1 : 0) - expectedFirst),
      100
    );
    const newSecondElo = Math.max(
      secondSong.elo + K * ((who === "second" ? 1 : 0) - expectedSecond),
      100
    );

    // Optimistically update UI, then update DB in background
    (async () => {
      await Promise.allSettled([
        databases.updateDocument("db", "songs", firstSong.$id, {
          elo: newFirstElo,
        }),
        databases.updateDocument("db", "songs", secondSong.$id, {
          elo: newSecondElo,
        }),
      ]);
    })();

    songs[firstIdx!].elo = newFirstElo;
    songs[secondIdx!].elo = newSecondElo;
    setSongs([...songs]);
    toast.info(
      <div>
        <div className="font-bold">Great choice!</div>
        <div>
          You picked “{who === "first" ? firstSong.name : secondSong.name}”.
          {boosted && (
            <span className="ml-2 text-purple-600 font-semibold">
              (Boosted: x2 points!)
            </span>
          )}
        </div>
      </div>
    );
    pickTwoRandomSongs();
  }

  async function removeSong(songId: string) {
    const index = songs.findIndex((song) => song.$id === songId);
    const songToDelete = songs[index];
    if (index === -1) return;
    // Optimistically update UI
    const newSongs = songs.filter((song) => song.$id !== songId);
    setSongs(newSongs);
    setPickedSongs(
      replaceDeletedPickedSong(songs, newSongs, pickedSongs, songId)
    );
    // Schedule actual deletion
    const timerId = window.setTimeout(async () => {
      try {
        await databases.deleteDocument("db", "songs", songId);
      } catch (error) {
        console.error("Error deleting song:", error);
        toast.error(
          <div>
            <div className="font-bold">Error</div>
            <div>Failed to delete the song.</div>
          </div>
        );
      } finally {
        // cleanup ref
        delete pendingDeletions.current[songId];
      }
    }, 3000);
    // Add to pending deletions
    pendingDeletions.current[songId] = { song: songToDelete, index, timerId };
    // Show toast with undo
    toast(
      <div>
        <div className="font-bold">Song removed</div>
        <div>The song has been successfully removed.</div>
        <Button variant="link" onClick={() => undoDelete(songId)}>
          Undo
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-6">
      <div className="w-full max-w-4xl space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Music className="h-8 w-8 text-purple-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              Choose Your Favorite
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            Click on your favorite song to make your selection
          </p>
        </div>

        {/* Song cards */}
        {loading || pickedSongs.length < 2 ? (
          <div className="text-center text-lg text-gray-500">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[0, 1].map((idx) => {
              const song = songs[pickedSongs[idx]!];
              if (!song) return null;
              return (
                <Card
                  key={song.$id}
                  onClick={() => win(idx === 0 ? "first" : "second")}
                  className="cursor-pointer transition-all duration-300 hover:scale-105"
                >
                  <CardHeader className="p-0 relative">
                    <Image
                      src={
                        song.image_url ||
                        "/placeholder.svg?height=300&width=300"
                      }
                      alt={`${song.album || "Album"} cover`}
                      width={300}
                      height={300}
                      className="w-full h-48 object-cover rounded-t-md md:aspect-square md:h-auto"
                    />
                  </CardHeader>
                  <CardContent className="space-y-1">
                    <h3 className="text-xl font-bold truncate">{song.name}</h3>
                    <p className="text-lg text-gray-700 truncate">
                      {song.artists || "Unknown Artist"}
                    </p>
                    <Badge variant="secondary">{song.album_name}</Badge>
                  </CardContent>
                  <CardFooter className="flex justify-around items-center">
                    <Button
                      variant="destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeSong(song.$id);
                      }}
                    >
                      <Trash className="m-1" />
                      Remove Song
                    </Button>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        win(idx === 0 ? "first" : "second", true);
                      }}
                    >
                      <Rocket className="m-1" />I love this song! Boost it!
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}

        {/* Pick new songs button */}
        {!loading && pickedSongs.length === 2 && (
          <div className="text-center">
            <Button onClick={pickTwoRandomSongs} variant="secondary">
              <Shuffle className="m-1" />I can't decide, pick new songs
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
