import { MAX_SONGS_FOR_USER } from '@/lib/constants';
import { MISSING_TOKEN, nextError } from '@/lib/errors';
import { getAndVerifyProviderAccessTokenFromHeader } from "@/lib/getProviderAccessTokenFromSessionHeader";
import { saveSongsToDB } from '@/lib/saveSongsToDB';
import { fetchSpotifyAPI } from '@/lib/spotify';
import { SpotifyPlaylistWithMetadata } from '@/types/spotify';
import { NextResponse } from 'next/server';

export const runtime = "edge";

export async function GET(request: Request) {
  const { providerAccessToken, userID } = await getAndVerifyProviderAccessTokenFromHeader(request.headers);
  if (!providerAccessToken) return nextError(MISSING_TOKEN);

  // add pagination constants
  const PAGE_SIZE = 50;

  // paginate & collect items
  const allItems: SpotifyPlaylistWithMetadata['items'] = [];
  let offset = 0;
  let hasMore = true;

  do {
    const query = `/me/tracks?limit=${PAGE_SIZE}&offset=${offset}`;
    const data = await fetchSpotifyAPI<SpotifyPlaylistWithMetadata>(query, providerAccessToken);

    allItems.push(...data.items);
    offset += PAGE_SIZE;
    hasMore = data.next !== null && allItems.length < MAX_SONGS_FOR_USER;

    console.log("OFFSET IS", offset, "HAS MORE:", hasMore);
  } while (hasMore);

  // trim to MAX_SONGS
  const itemsToSave = allItems.slice(0, MAX_SONGS_FOR_USER);

  const successCount = await saveSongsToDB(userID, itemsToSave.map(item => {
    return {
      user_id: userID,
      provider_id: item.track.id,
      provider: 'spotify',
      album_name: item.track.album.name,
      artists: item.track.artists.map((artist) => artist.name).join(', '),
      elo: 1000,
      image_url: item.track.album.images[0]?.url || '',
      name: item.track.name,
      // preview_url: item.track.preview_url || undefined,
      // Spotify API deprecated the preview_url field, so we can leave it out
    };
  }));

  return NextResponse.json(
    { message: `${successCount} songs saved to database successfully` },
    { status: 200 }
  );
}
