"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useSongs } from "@/lib/SongsContext";
import { Trophy } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

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

export default function LeaderboardPage() {
  const { songs, loading, sortSongsByElo } = useSongs();
  const [displayCount, setDisplayCount] = useState(20);

  useEffect(() => {
    sortSongsByElo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onScroll = () => {
      if (
        window.innerHeight + window.scrollY >=
          document.documentElement.scrollHeight - 300 && // was 100, now 300
        displayCount < songs.length
      ) {
        setDisplayCount((prev) => Math.min(prev + 10, songs.length));
      }
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [displayCount, songs.length]);

  if (songs.length === 0 && !loading) {
    return (
      <div className="flex items-center justify-center py-10">
        No songs found.
      </div>
    );
  }

  const maxElo = songs[0]?.elo ?? 0;
  const minElo = songs[songs.length - 1]?.elo ?? 0;
  const baseline = Math.max(0, minElo - 50);
  const range = maxElo - baseline;

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "from-yellow-50 to-yellow-100 border-yellow-200";
      case 2:
        return "from-slate-100 to-slate-300 border-slate-400";
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
          {(loading
            ? Array.from(
                { length: displayCount },
                (_, idx) => ({} as (typeof songs)[0])
              )
            : songs
          )

            .slice(0, displayCount)
            .map((song, idx) => {
              const rank = loading ? 0 : idx + 1;
              const adjusted = loading ? 0 : song.elo - baseline;
              const percentage = loading
                ? 0
                : Math.round((adjusted / range) * 100);

              return (
                <Card
                  key={loading ? idx : song.id}
                  className={`transition-all duration-300 hover:shadow-lg bg-gradient-to-r ${getRankColor(
                    rank
                  )} border-2`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center gap-6">
                      <div className="flex-shrink-0">
                        {loading ? (
                          <Skeleton className="w-20 h-20 rounded-lg" />
                        ) : (
                          <Image
                            src={song.image_url || "/placeholder.svg"}
                            alt={`${song.album_name} album cover`}
                            width={80}
                            height={80}
                            className="w-20 h-20 object-cover rounded-lg shadow-md"
                          />
                        )}
                      </div>

                      <div className="flex-grow min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div className="min-w-0 flex-1">
                            <h3 className="flex items-center text-lg sm:text-xl font-bold text-gray-900">
                              <span className="flex-shrink-0 mr-2">
                                {!loading && getRankIcon(rank)}
                              </span>
                              <span className="flex-1 min-w-0 truncate">
                                {loading ? (
                                  <Skeleton className="h-5 w-40 rounded" />
                                ) : (
                                  song.name
                                )}
                              </span>
                            </h3>
                            <p className="text-lg text-gray-700 font-medium truncate">
                              {loading ? (
                                <Skeleton className="h-4 w-32 mt-2 rounded" />
                              ) : (
                                song.artists
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            {loading ? (
                              <Skeleton className="h-2 rounded-full w-full" />
                            ) : (
                              <div
                                className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                                style={{ width: `${percentage}%` }}
                              />
                            )}
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
