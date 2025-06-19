"use client";

import { Button } from "@/components/ui/button";
import { Card, CardFooter, CardHeader } from "@/components/ui/card";
import { useToast } from "@/components/ui/sonner";
import { Merge, Music, Rocket, Shuffle, Trash } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

// --- new imports for database and user context ---
import YouTubePreview from "@/components/youtubePreview";
import { databases } from "@/lib/appwrite";
import { DatabaseSong } from "@/lib/appwriteAdmin";
import { useSongs } from "@/lib/SongsContext";
import { getVideoIDFromSearchQuery } from "@/lib/youtube";
import { useLoggedInUser } from "@/lib/UserContext";
// -------------------------------------------------

export default function PlayPage() {
  const user = useLoggedInUser();
  const [duelCount, setDuelCount] = useState(0);
  const { toast } = useToast();
  const { songs, setSongs, loading, sortSongsByElo } = useSongs();
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
      const tasteBreaker = Math.random() < 0.2; // 20% chance to break taste
      if (tasteBreaker) {
        // pick one song from the first %25 and the second from the last %25
        // we gotta sort the songs first
        sortSongsByElo();
        const percentage = 0.25;
        const firstQuarter = Math.floor(indices.length * percentage);
        const lastQuarter = Math.ceil(indices.length * (1 - percentage));
        const firstIdx = Math.floor(Math.random() * firstQuarter);
        const secondIdx = Math.floor(
          Math.random() * (indices.length - lastQuarter) + lastQuarter
        );
        // make the order random
        const _indices = [indices[firstIdx], indices[secondIdx]];
        if (Math.random() < 0.5) {
          return [_indices[0], _indices[1]];
        }
        return [_indices[1], _indices[0]];
      } else {
        for (let i = indices.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [indices[i], indices[j]] = [indices[j], indices[i]];
        }
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
  function pickTwoRandomSongs() {
    setPickedSongs(pickTwoSongs(songs));
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

    const eloNoiseRange = 5; // maximum ± range for random drift

    const rawFirst =
      firstSong.elo +
      K * ((who === "first" ? 1 : 0) - expected(firstSong.elo, secondSong.elo));
    const rawSecond =
      secondSong.elo +
      K *
        ((who === "second" ? 1 : 0) - expected(secondSong.elo, firstSong.elo));

    // apply random drift and ensure minimum of 100
    const newFirstElo = Math.max(
      100,
      Math.round(rawFirst + (Math.random() * 2 - 1) * eloNoiseRange)
    );
    const newSecondElo = Math.max(
      100,
      Math.round(rawSecond + (Math.random() * 2 - 1) * eloNoiseRange)
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
    pickTwoRandomSongs();
    setDuelCount((prev) => prev + 1);
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

  async function mergeSongs() {
    // This can happen if a song is added both from Spotify and YouTube Music
    // remove the song with the lower ELO, pick two new songs
    if (pickedSongs.length < 2) return;
    const [firstIdx, secondIdx] = pickedSongs;
    const firstSong = songs[firstIdx!];
    const secondSong = songs[secondIdx!];
    if (!firstSong || !secondSong) return;
    const songToKeep = firstSong.elo >= secondSong.elo ? firstSong : secondSong;
    const songToDelete =
      firstSong.elo < secondSong.elo ? firstSong : secondSong;
    // optimistically update UI
    const newSongs = songs.filter((song) => song.$id !== songToDelete.$id);
    setSongs(newSongs);
    setPickedSongs(pickTwoSongs(newSongs));
    // remove from the db
    (async () => {
      await databases.deleteDocument("db", "songs", songToDelete.$id);
    })();
    toast.success(
      <div>
        <div className="font-bold">Songs merged</div>
        <div>
          The song “{songToDelete.name}” has been removed. You kept “
          {songToKeep.name}”.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
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

          <p className="text-gray-500 text-sm mt-2">
            {duelCount > 0
              ? `You've made ${duelCount} ${
                  duelCount === 1 ? "choice" : "choices"
                } so far.`
              : "Start by picking two songs!"}
          </p>
        </div>

        {/* Song cards */}
        {loading ? (
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
                  className="cursor-pointer transition-all duration-300 hover:scale-105 pt-0"
                >
                  <CardHeader className="p-0 relative">
                    <div className="relative w-full h-48 md:aspect-square md:h-auto overflow-hidden rounded-t-md">
                      <Image
                        src={
                          song.image_url ||
                          "/placeholder.svg?height=300&width=300"
                        }
                        alt={`${song.album || "Album"} cover`}
                        fill
                        className="object-cover"
                        style={{ objectFit: "cover" }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black/40" />
                      <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                        <h3 className="text-xl font-extrabold tracking-tight truncate drop-shadow-lg">
                          {song.name}
                        </h3>
                        <p className="text-lg truncate drop-shadow-lg opacity-90">
                          {song.artists || "Unknown Artist"}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardFooter className="flex flex-row flex-wrap gap-4">
                    <Button
                      variant="destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeSong(song.$id);
                      }}
                      className="w-full flex-1"
                    >
                      <Trash className="m-1" />
                      Remove
                    </Button>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        win(idx === 0 ? "first" : "second", true);
                      }}
                      className="w-full flex-1"
                    >
                      <Rocket className="m-1" />
                      Boost!
                    </Button>
                    <YouTubePreview
                      videoId={async () => {
                        if (song.provider === "google") {
                          return song.provider_id;
                        } else if (song.provider === "spotify") {
                          return await getVideoIDFromSearchQuery(
                            `${song.name} - ${song.artists}`,
                            user
                          );
                        } else {
                          return null;
                        }
                      }}
                    />
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}

        {/* Pick new songs button */}
        {!loading && pickedSongs.length === 2 && (
          <div className="flex flex-col md:flex-row justify-center mt-6 gap-4 w-full max-w-xl mx-auto">
            <div className="flex-1 flex">
              <Button
                onClick={pickTwoRandomSongs}
                variant="secondary"
                className="w-full"
              >
                <Shuffle className="m-1" />I can't decide, pick new songs
              </Button>
            </div>
            <div className="flex-1 flex">
              <Button
                onClick={mergeSongs}
                variant="secondary"
                className="w-full"
              >
                <Merge className="m-1" />
                These two are the same, merge them
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
