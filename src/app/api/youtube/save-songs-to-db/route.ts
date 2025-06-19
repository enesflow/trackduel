import { MAX_SONGS_FOR_USER } from '@/lib/constants';
import { MISSING_TOKEN, nextError } from '@/lib/errors';
import { getAndVerifyProviderAccessTokenFromHeader } from "@/lib/getProviderAccessTokenFromSessionHeader";
import { saveSongsToDB } from '@/lib/saveSongsToDB';
import { fetchYouTubeAPI } from '@/lib/youtube';
import type { YoutubePlaylistItemListResponse } from '@/types/youtube.d.ts';
import { NextResponse } from 'next/server';

export const runtime = "edge";

export async function GET(request: Request) {
  const { providerAccessToken, userID } = await getAndVerifyProviderAccessTokenFromHeader(request.headers);
  if (!providerAccessToken) return nextError(MISSING_TOKEN);

  // add pagination constants
  const PAGE_SIZE = 50;

  // paginate & collect items
  const allItems: YoutubePlaylistItemListResponse['items'] = [];
  let pageToken: string | undefined = undefined;
  do {
    const query: string = `/playlistItems?part=snippet,contentDetails&playlistId=LM&maxResults=${PAGE_SIZE}`
      + (pageToken ? `&pageToken=${pageToken}` : '');
    const data = await fetchYouTubeAPI<YoutubePlaylistItemListResponse>(query, providerAccessToken);
    allItems.push(...data.items);
    pageToken = data.nextPageToken;
    console.log("PAGE TOKEN IS", pageToken);
  } while (pageToken && allItems.length < MAX_SONGS_FOR_USER);

  // trim to MAX_SONGS
  const itemsToSave = allItems.slice(0, MAX_SONGS_FOR_USER);

  const successCount = await saveSongsToDB(userID, itemsToSave.map(item => {
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

  return NextResponse.json(
    { message: `${successCount} songs saved to database successfully` },
    { status: 200 }
  );
}
