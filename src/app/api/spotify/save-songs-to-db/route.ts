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
  const data = await fetchSpotifyAPI<SpotifyPlaylistWithMetadata>(
    '/me/tracks?limit=50',
    providerAccessToken
  );
  const successCount = await saveSongsToDB(userID, data.items.map(item => {
    return {
      user_id: userID,
      provider_id: item.track.id,
      provider: 'spotify',
      album_name: item.track.album.name,
      artists: item.track.artists.map((artist) => artist.name).join(', '),
      elo: 1000,
      image_url: item.track.album.images[0]?.url || '',
      name: item.track.name,
    };
  }));

  return NextResponse.json({ message: `${successCount} songs saved to database successfully` }, { status: 200 });
}
