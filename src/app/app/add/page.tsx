"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { saveSongs } from "@/lib/saveSongs";
import { useSongs } from "@/lib/SongsContext";
import { useLoggedInUser } from "@/lib/UserContext";
import { Provider } from "@/types/provider";
import { Check, Download, Loader2, Music } from "lucide-react";
import { useEffect, useState } from "react";
import { SiSpotify, SiYoutubemusic } from "react-icons/si";

const Logos: Record<Provider, React.ReactNode> = {
  spotify: <SiSpotify className="w-6 h-6 text-green-500" />,
  google: <SiYoutubemusic className="w-6 h-6 text-red-500" />,
};
const CardDescriptionProvider: Record<Provider, React.ReactNode> = {
  spotify: <strong className="text-green-600">Spotify</strong>,
  google: <strong className="text-red-600">YouTube Music</strong>,
};
const Names: Record<Provider, string> = {
  spotify: "Spotify",
  google: "YouTube Music",
};

export default function AddSongsPage() {
  const [transferState, setTransferState] = useState<
    "idle" | "loading" | "success"
  >("idle");
  const [sessionProvider, setSessionProvider] = useState<Provider | null>(null);
  const user = useLoggedInUser();
  const songs = useSongs();

  const startTransfer = async () => {
    setTransferState("loading");
    try {
      const response = await saveSongs(user);
      console.log("Response from save-songs-to-db:", response);
      await songs.refreshSongs();
      setTransferState("success");
    } catch (error) {
      setTransferState("idle");
      // Optionally handle error
      console.error(error);
    }
  };

  useEffect(() => {
    user.getSession().then((session) => {
      if (session && session.provider) {
        setSessionProvider(session.provider as Provider);
      }
    });
  }, [user]);

  if (!sessionProvider) {
    return null;
  }
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
          <div className="mt-4">
            <span className="text-gray-700">Welcome, {user.current.name}!</span>
          </div>
          <p className="text-gray-600 text-lg">
            Transfer your saved songs from your Library to get started
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              {Logos[sessionProvider]}
              <CardTitle className="text-xl">
                {Names[sessionProvider]} Library
              </CardTitle>
            </div>
            <CardDescription>
              Import all your saved songs and liked tracks from{" "}
              {Names[sessionProvider]}
              <br />
              To import from{" "}
              {sessionProvider !== "spotify" &&
                CardDescriptionProvider["spotify"]}
              {sessionProvider !== "google" &&
                CardDescriptionProvider["google"]}
              , please log out and log back in with your Spotify account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {transferState === "idle" && (
              <Button
                onClick={startTransfer}
                className="w-full py-6 text-lg  font-semibold"
                variant="outline"
              >
                Start Importing
              </Button>
            )}

            {transferState === "loading" && (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="font-medium">Importing your music...</span>
                </div>
              </div>
            )}

            {transferState === "success" && (
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-2 mb-2">
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
