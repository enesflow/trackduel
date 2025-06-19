"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { fetchNextJSAPIWithToken } from "@/lib/fetch";
import { useSongs } from "@/lib/SongsContext";
import { useLoggedInUser } from "@/lib/UserContext";
import {
  Check,
  Download,
  Loader2,
  Music,
  AirplayIcon as Spotify,
} from "lucide-react";
import { useState } from "react";

export default function AddSongsPage() {
  const [transferState, setTransferState] = useState<
    "idle" | "loading" | "success"
  >("idle");
  const user = useLoggedInUser();
  const songs = useSongs();

  const startTransfer = async () => {
    setTransferState("loading");
    try {
      const response = await fetchNextJSAPIWithToken<string[]>(
        "save-songs-to-db",
        user
      );
      console.log("Response from save-songs-to-db:", response);
      await songs.refreshSongs();
      setTransferState("success");
    } catch (error) {
      setTransferState("idle");
      // Optionally handle error
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen p-4">
      <div className="w-full max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Download className="w-8 h-8 text-purple-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              Import Your Music
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            Transfer your saved songs from Spotify to get started
          </p>
          {user.current && (
            <div className="mt-4">
              <span className="text-gray-700">
                Welcome, {user.current.name}!
              </span>
            </div>
          )}
        </div>

        <Card className="mb-6">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Spotify className="w-6 h-6 text-green-500" />
              <CardTitle className="text-xl">Spotify Library</CardTitle>
            </div>
            <CardDescription>
              Import all your saved songs and liked tracks from Spotify
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {transferState === "idle" && (
              <Button
                onClick={startTransfer}
                className="w-full py-6 text-lg bg-green-600 hover:bg-green-700"
              >
                <Spotify className="w-5 h-5 mr-2" />
                Import Spotify Library
              </Button>
            )}

            {transferState === "loading" && (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2 text-green-600">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="font-medium">Importing your music...</span>
                </div>
              </div>
            )}

            {transferState === "success" && (
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-2 text-green-600">
                  <Check className="w-6 h-6" />
                  <span className="font-semibold text-lg">
                    Import Complete!
                  </span>
                </div>
                <p className="text-gray-600">
                  Successfully imported your Spotify library.
                </p>
                <a href="/app/play" className="mt-4 inline-block w-full">
                  <Button asChild variant="outline" className="w-full">
                    <span className="flex items-center justify-center">
                      <Music className="w-4 h-4 mr-2" />
                      Start Playing
                    </span>
                  </Button>
                </a>
              </div>
            )}

            {/* {songs.length > 0 && (
              <div className="mt-6">
                <h2 className="text-lg font-semibold mb-2">Imported Songs:</h2>
                <ul className="list-disc list-inside text-left">
                  {songs.map((song) => (
                    <li key={song}>{song}</li>
                  ))}
                </ul>
              </div>
            )} */}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
