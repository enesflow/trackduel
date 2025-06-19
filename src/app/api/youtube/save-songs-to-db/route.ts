import { MISSING_TOKEN, nextError } from '@/lib/errors';
import { getAndVerifyProviderAccessTokenFromHeader } from "@/lib/getProviderAccessTokenFromSessionHeader";
import { fetchYouTubeAPI } from '@/lib/youtube';
import type { YoutubePlaylistItemListResponse } from '@/types/youtube.d.ts';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { providerAccessToken, userID } = await getAndVerifyProviderAccessTokenFromHeader(request.headers);
  if (!providerAccessToken) return nextError(MISSING_TOKEN);
  const data = await fetchYouTubeAPI<YoutubePlaylistItemListResponse>(
    '/playlistItems?part=snippet,contentDetails&playlistId=LM&maxResults=2',
    providerAccessToken
  );

  console.log("YouTube API data:", JSON.stringify(data, null, 2));
  const successCount = -1;
  return NextResponse.json({ message: `${successCount} songs saved to database successfully` }, { status: 200 });
}


/* const results = await Promise.allSettled(
    data.items.map((item) => {
      const song: DatabaseInputSong = {
        user_id: userID,
        spotify_id: item.track.id,
        album_name: item.track.album.name,
        artists: item.track.artists.map((artist) => artist.name).join(', '),
        elo: 1000,
        image_url: item.track.album.images[0]?.url || '',
        name: item.track.name,
      };
      return adminDatabases.createDocument(
        "db",
        "songs",
        ID.unique(),
        song,
        [
          Permission.read(Role.user(userID)),
          Permission.update(Role.user(userID)),
          Permission.delete(Role.user(userID)),
        ],
      );
    })
  );
  const successCount = results.filter(result => result.status === 'fulfilled').length; */