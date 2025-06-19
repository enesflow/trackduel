"use client";

import { useSongs } from "@/lib/SongsContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Music } from "lucide-react";
import Image from "next/image";
import { useEffect } from "react";

export default function LeaderboardPage() {
  const { songs, loading, sortSongsByElo } = useSongs();

  useEffect(() => {
    sortSongsByElo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">Loading...</div>
    );
  }

  if (songs.length === 0) {
    return (
      <div className="flex items-center justify-center py-10">
        No songs found.
      </div>
    );
  }

  const maxElo = songs[0].elo;
  const minElo = songs[songs.length - 1].elo;
  const baseline = Math.max(0, minElo - 50);
  const range = maxElo - baseline;

  const getRankIcon = (rank: number) => {
    const size = "w-8 h-6";
    switch (rank) {
      case 1:
        return <Trophy className={`${size} text-yellow-500`} />;
      case 2:
        return <Trophy className={`${size} text-gray-400`} />;
      case 3:
        return <Trophy className={`${size} text-amber-600`} />;
      default:
        return (
          <span
            className={`${size} flex items-center justify-center text-lg font-bold text-gray-600`}
          >
            #{rank}
          </span>
        );
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "from-yellow-50 to-yellow-100 border-yellow-200";
      case 2:
        return "from-gray-50 to-gray-100 border-gray-200";
      case 3:
        return "from-amber-50 to-amber-100 border-amber-200";
      default:
        return "from-white to-gray-50 border-gray-200";
    }
  };

  return (
    <div className="min-h-screen p-4">
      <div className="w-full max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Trophy className="w-8 h-8 text-purple-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              Song Leaderboard
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            Your most favorite songs ranked.
          </p>
        </div>

        <div className="space-y-4">
          {songs.map((song, idx) => {
            const rank = idx + 1;
            const adjusted = song.elo - baseline;
            const percentage =
              range > 0 ? Math.round((adjusted / range) * 100) : 0;

            return (
              <Card
                key={song.$id}
                className={`transition-all duration-300 hover:shadow-lg bg-gradient-to-r ${getRankColor(
                  rank
                )} border-2`}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-6">
                    <div className="flex-shrink-0">
                      <Image
                        src={song.image_url || "/placeholder.svg"}
                        alt={`${song.album_name} album cover`}
                        width={80}
                        height={80}
                        className="w-20 h-20 object-cover rounded-lg shadow-md"
                      />
                    </div>

                    <div className="flex-grow min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="min-w-0 flex-1">
                          <h3 className="flex items-center text-lg sm:text-xl font-bold text-gray-900">
                            <span className="flex-shrink-0 mr-2">
                              {getRankIcon(rank)}
                            </span>
                            <span className="flex-1 min-w-0 truncate">
                              {song.name}
                            </span>
                          </h3>
                          <p className="text-lg text-gray-700 font-medium truncate">
                            {song.artists}
                          </p>
                          <Badge
                            variant="secondary"
                            className="block max-w-full text-xs sm:text-sm mt-1 truncate"
                          >
                            {song.album_name}
                          </Badge>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
