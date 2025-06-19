import { MISSING_TOKEN, nextError } from '@/lib/errors';
import { getAndVerifyProviderAccessTokenFromHeader } from "@/lib/getProviderAccessTokenFromSessionHeader";
import { saveSongsToDB } from '@/lib/saveSongsToDB';
import { fetchYouTubeAPI } from '@/lib/youtube';
import type { YoutubePlaylistItemListResponse } from '@/types/youtube.d.ts';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { providerAccessToken, userID } = await getAndVerifyProviderAccessTokenFromHeader(request.headers);
  if (!providerAccessToken) return nextError(MISSING_TOKEN);
  const data = await fetchYouTubeAPI<YoutubePlaylistItemListResponse>(
    '/playlistItems?part=snippet,contentDetails&playlistId=LM&maxResults=64',
    providerAccessToken
  );
  const successCount = await saveSongsToDB(userID, data.items.map(item => {
    return {
      user_id: userID,
      provider_id: item.contentDetails.videoId,
      provider: 'google',
      album_name: item.snippet.title,
      artists: item.snippet.videoOwnerChannelTitle,
      elo: 1000,
      image_url: item.snippet.thumbnails.maxres?.url
        || item.snippet.thumbnails.standard?.url
        || item.snippet.thumbnails.high?.url
        || item.snippet.thumbnails.medium?.url
        || item.snippet.thumbnails.default.url,
      name: item.snippet.title,
    };
  }));
  return NextResponse.json({ message: `${successCount} songs saved to database successfully` }, { status: 200 });
}
