import { MISSING_QUERY, MISSING_TOKEN, nextError, NO_VIDEOS_FOUND } from '@/lib/errors';
import { getAndVerifyProviderAccessTokenFromHeader } from "@/lib/getProviderAccessTokenFromSessionHeader";
import { fetchYouTubeAPI } from '@/lib/youtube';
import type { YoutubeSearchListResponse } from '@/types/youtube.d.ts';
import { NextResponse } from 'next/server';

export const runtime = "edge";

export async function GET(request: Request) {
  const { providerAccessToken } = await getAndVerifyProviderAccessTokenFromHeader(request.headers);
  if (!providerAccessToken) return nextError(MISSING_TOKEN);
  const searchQuery = new URL(request.url).searchParams.get('query');
  if (!searchQuery) return nextError(MISSING_QUERY);

  // search for youtube videos for the query, get the first one
  const searchResponse = await fetchYouTubeAPI<YoutubeSearchListResponse>(
    `/search?part=id&type=video&maxResults=1&q=${encodeURIComponent(searchQuery)}`,
    providerAccessToken
  );
  if (!searchResponse.items || searchResponse.items.length === 0) {
    return nextError(NO_VIDEOS_FOUND);
  }

  return NextResponse.json(
    { id: searchResponse.items[0].id.videoId, },
    { status: 200 }
  );
}
