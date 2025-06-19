import { adminDatabases, DatabaseSong } from '@/lib/appwriteAdmin';
import { MISSING_TOKEN, nextError } from '@/lib/errors';
import { getAndVerifyProviderAccessTokenFromHeader } from "@/lib/getProviderAccessTokenFromSessionHeader";
import { fetchSpotifyAPI } from '@/lib/spotify';
import { SpotifyPlaylistWithMetadata } from '@/types/spotify';
import { NextResponse } from 'next/server';
import { ID, Permission, Role } from 'node-appwrite';

export async function GET(request: Request) {
  const { providerAccessToken, userID } = await getAndVerifyProviderAccessTokenFromHeader(request.headers);
  if (!providerAccessToken) return nextError(MISSING_TOKEN);
  const data = await fetchSpotifyAPI<SpotifyPlaylistWithMetadata>(
    '/me/tracks?limit=50',
    providerAccessToken
  );
  const results = await Promise.allSettled(
    data.items.map((item) => {
      const song: DatabaseSong = {
        user_id: userID,
        spotify_id: item.track.id,
        album_name: item.track.album.name,
        artists: item.track.artists.map((artist) => artist.name).join(', '),
        elo: 0, // Default ELO value, can be updated later
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
  const successCount = results.filter(result => result.status === 'fulfilled').length;
  return NextResponse.json({ message: `${successCount} songs saved to database successfully` }, { status: 200 });
}
