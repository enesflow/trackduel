"use client";

import { Button } from "@/components/ui/button";
import { Card, CardFooter, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/sonner";
import { Merge, Music, Rocket, Shuffle, Trash } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

// --- new imports for database and user context ---
import YouTubePreview, {
  YouTubePreviewHandle,
} from "@/components/youtubePreview";
import { databases } from "@/lib/appwrite";
import { DatabaseSong } from "@/lib/appwriteAdmin";
import { updateELOsAfterWinning } from "@/lib/elo";
import { deleteSongWithLowerELO } from "@/lib/play";
import { useSongs } from "@/lib/SongsContext";
import { useLoggedInUser } from "@/lib/UserContext";
import { getVideoIDFromSearchQuery } from "@/lib/youtube";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

// Duration for each preview in ms
const previewPlaybackDuration = 7000;
// -------------------------------------------------

// spinner with CSS animation
function AutoplaySpinner({ duration }: { duration: number }) {
  const r = 8;
  const c = 2 * Math.PI * r;

  return (
    <svg className="w-5 h-5" viewBox="0 0 20 20">
      <circle cx="10" cy="10" r={r} stroke="#000" strokeWidth="2" fill="none" />
      <circle
        cx="10"
        cy="10"
        r={r}
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        style={{
          strokeDasharray: c,
          strokeDashoffset: c,
          transform: "rotate(-90deg)",
          transformOrigin: "50% 50%",
          transition: `stroke-dashoffset ${duration}ms linear`,
          animation: `progress ${duration}ms linear forwards`,
        }}
      />

      <style
        dangerouslySetInnerHTML={{
          __html: `
          @keyframes progress {
            from { stroke-dashoffset: ${c}; }
            to { stroke-dashoffset: 0; }
          }
        `,
        }}
      />
    </svg>
  );
}

export default function PlayPage() {
  const user = useLoggedInUser();
  const [duelCount, setDuelCount] = useState(0);
  const { toast } = useToast();
  const songsCtx = useSongs();
  const [pickedSongs, setPickedSongs] = useState<[number, number] | []>([]);
  // Track pending deletions for undo support via ref
  const pendingDeletions = useRef<
    Record<string, { song: DatabaseSong; index: number; timerId: number }>
  >({});
  const [autoplay, setAutoplay] = useState(false);
  // cache resolved video IDs for previews
  const [videoIds, setVideoIds] = useState<(string | null)[]>([]);
  // ----------------------------------------------

  // pick two random songs after loading
  useEffect(() => {
    if (!songsCtx.loading && songsCtx.songs.length >= 2) {
      setPickedSongs(pickTwoSongs(songsCtx.songs));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [songsCtx.loading]);

  // fetch and cache video IDs once per pickedSongs change to avoid repeated API calls
  useEffect(() => {
    (async () => {
      const ids: (string | null)[] = [];
      for (let idx = 0; idx < (pickedSongs as number[]).length; idx++) {
        const song = songsCtx.songs[pickedSongs[idx]];
        if (!song) {
          ids[idx] = null;
          continue;
        }
        try {
          if (song.provider === "google") ids[idx] = song.provider_id;
          else if (song.provider === "spotify")
            ids[idx] = await getVideoIDFromSearchQuery(
              `${song.name} - ${song.artists}`,
              user
            );
          else ids[idx] = null;
        } catch {
          ids[idx] = null;
        }
      }
      setVideoIds(ids);
    })();
  }, [pickedSongs, songsCtx.songs]);

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
        songsCtx.sortSongsByElo();
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
    songsCtx.setSongs((prev) => {
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

  async function removeSong(songId: string) {
    const index = songsCtx.songs.findIndex((song) => song.$id === songId);
    const songToDelete = songsCtx.songs[index];
    if (index === -1) return;
    // Optimistically update UI
    const newSongs = songsCtx.songs.filter((song) => song.$id !== songId);
    songsCtx.setSongs(newSongs);
    setPickedSongs(
      replaceDeletedPickedSong(songsCtx.songs, newSongs, pickedSongs, songId)
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

  ///////////////////////////////////
  //// ------ Refactored ------- ////
  ///////////////////////////////////

  async function win(winner: "first" | "second", boosted: boolean = false) {
    if (pickedSongs.length < 2) return;
    const { promise, newSongs } = updateELOsAfterWinning(
      songsCtx,
      pickedSongs as [number, number],
      winner,
      boosted ? 64 : 32
    );
    setPickedSongs(pickTwoSongs(newSongs));
    setDuelCount((prev) => prev + 1);
    await promise;
  }

  async function mergeSongs() {
    // This can happen if a song is added both from Spotify and YouTube Music
    // remove the song with the lower ELO, pick two new songs
    if (pickedSongs.length < 2) return;
    const { newSongs, promise } = deleteSongWithLowerELO(
      songsCtx,
      pickedSongs as [number, number]
    );
    setPickedSongs(pickTwoSongs(newSongs));
    await promise;
  }

  const firstSongRef = useRef<YouTubePreviewHandle>(null);
  const secondSongRef = useRef<YouTubePreviewHandle>(null);

  // helper: sleep for ms
  const sleep = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  // helper: play first then second with proper async timing
  const playPreview = async () => {
    if (
      pickedSongs.length < 2 ||
      !firstSongRef.current ||
      !secondSongRef.current
    )
      return;
    await firstSongRef.current.play();
    await sleep(previewPlaybackDuration);
    await firstSongRef.current.stop();
    await secondSongRef.current.play();
    await sleep(previewPlaybackDuration);
    await secondSongRef.current.stop();
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!autoplay) {
        void firstSongRef.current?.stop();
        void secondSongRef.current?.stop();
        return;
      }
      // prewarm players to load iframes
      if (firstSongRef.current && secondSongRef.current) {
        await firstSongRef.current.play();
        await firstSongRef.current.stop();
        await secondSongRef.current.play();
        await secondSongRef.current.stop();
      }
      while (!cancelled && autoplay) {
        await playPreview();
      }
    })();
    return () => {
      cancelled = true;
      void firstSongRef.current?.stop();
      void secondSongRef.current?.stop();
    };
  }, [pickedSongs, autoplay]);
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
            {duelCount > 0
              ? `You've made ${duelCount} ${
                  duelCount === 1 ? "choice" : "choices"
                } so far.`
              : "Start by picking a song below!"}
          </p>

          <div className="flex items-center justify-center space-x-2 my-4">
            <Switch
              id="autoplay"
              onCheckedChange={setAutoplay}
              checked={autoplay}
            />
            <Label htmlFor="autoplay" className="text-sm">
              Enable Autoplay
            </Label>
          </div>
        </div>

        {/* Song cards */}
        {songsCtx.loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[0, 1].map((idx) => (
              <Card key={idx} className="pt-0">
                <CardHeader className="p-0 relative">
                  <div className="relative w-full h-48 md:aspect-square md:h-auto overflow-hidden rounded-t-md">
                    <Skeleton className="absolute inset-0 w-full h-full" />
                  </div>
                </CardHeader>
                <CardFooter className="flex flex-row flex-wrap gap-4">
                  <Skeleton className="h-10 w-full flex-1" />
                  <Skeleton className="h-10 w-full flex-1" />
                  <Skeleton className="h-10 w-full flex-1" />
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[0, 1].map((idx) => {
              const song = songsCtx.songs[pickedSongs[idx]!];
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
                      key={`preview-${song.$id}-at-${duelCount}`}
                      videoId={() => videoIds[idx]}
                      ref={idx === 0 ? firstSongRef : secondSongRef}
                      buttonDisabled={autoplay}
                      pauseIcon={
                        autoplay ? (
                          <AutoplaySpinner duration={previewPlaybackDuration} />
                        ) : undefined
                      }
                    />
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}

        {/* Pick new songs button */}
        {!songsCtx.loading && pickedSongs.length === 2 && (
          <div className="flex flex-col md:flex-row justify-center mt-6 gap-4 w-full max-w-xl mx-auto">
            <div className="flex-1 flex">
              <Button
                onClick={() => {
                  setPickedSongs(pickTwoSongs(songsCtx.songs));
                }}
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
