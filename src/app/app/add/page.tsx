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
import { Check, Download, FileQuestion, Loader2, Music } from "lucide-react";
import { useEffect, useState } from "react";
import { SiSpotify, SiYoutubemusic } from "react-icons/si";

const Logos: Record<Provider, React.ReactNode> = {
  spotify: <SiSpotify className="w-6 h-6 text-green-500" />,
  google: <SiYoutubemusic className="w-6 h-6 text-red-500" />,
};
function getLogo(provider: Provider | string): React.ReactNode {
  return (
    Logos[provider as Provider] || (
      <FileQuestion className="w-6 h-6 text-gray-500" />
    )
  );
}
const CardDescriptionProvider: Record<Provider, React.ReactNode> = {
  spotify: <strong className="text-green-600">Spotify</strong>,
  google: <strong className="text-red-600">YouTube Music</strong>,
};
function getCardDescription(provider: Provider | string): React.ReactNode {
  return (
    CardDescriptionProvider[provider as Provider] || (
      <span className="text-gray-600">Spotify</span>
    )
  );
}
const Names: Record<Provider, string> = {
  spotify: "Spotify",
  google: "YouTube Music",
};
function getName(provider: Provider | string): string {
  return Names[provider as Provider] || "Unknown Provider";
}

export default function AddSongsPage() {
  const [transferState, setTransferState] = useState<
    "idle" | "loading" | "success"
  >("idle");
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

  if (!user.session.provider) {
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
              {getLogo(user.session.provider)}
              <CardTitle className="text-xl">
                {getName(user.session.provider)} Library
              </CardTitle>
            </div>
            <CardDescription>
              Import all your saved songs and liked tracks from{" "}
              {getCardDescription(user.session.provider)} to your
              <br />
              To import from{" "}
              {user.session.provider !== "spotify" &&
                CardDescriptionProvider["spotify"]}
              {user.session.provider !== "google" &&
                CardDescriptionProvider["google"]}
              , please log out and log back in with your Spotify account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Button for idle and loading: inline loader and disabled state, consistent layout */}
            {transferState !== "success" && (
              <Button
                onClick={startTransfer}
                disabled={transferState === "loading"}
                className="w-full py-6 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                variant="outline"
              >
                <div className="flex items-center justify-center gap-2">
                  {transferState === "loading" && (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  )}
                  <span className="font-medium">
                    {transferState === "loading"
                      ? "Importing your music..."
                      : "Start Importing"}
                  </span>
                </div>
              </Button>
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
