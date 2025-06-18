import { SpotifyPlaylist } from '@/types/spotify';
import { NextResponse } from 'next/server';

const SPOTIFY_API_BASE_URL = 'https://api.spotify.com/v1';

async function throwErrorIfNotOk(response: Response): Promise<Response & { ok: true }> {
  if (!response.ok) {
    const errorBody = await response.text();
    console.error('Spotify API error:', response.status, response.statusText, errorBody);
    throw new Error(`Spotify API error: ${response.status} ${response.statusText}`);
  }
  return response as Response & { ok: true };
}

function getAuthorizationHeader(providerAccessToken: string): HeadersInit {
  return {
    'Authorization': `Bearer ${providerAccessToken}`,
    'Content-Type': 'application/json',
  };
}

async function getUserSavedSongsServer(
  providerAccessToken: string,
): Promise<SpotifyPlaylist> {
  const response = await fetch(`${SPOTIFY_API_BASE_URL}/me/tracks?limit=20`, {
    headers: getAuthorizationHeader(providerAccessToken),
  });
  const okResponse = await throwErrorIfNotOk(response);
  const data = await okResponse.json();
  return data.items as SpotifyPlaylist;
}

export async function GET(request: Request) {
  try {
    // PLEASE FIX THIS IN THE FUTURE URL PARAMETERS ???? WTF
    const url = new URL(request.url);
    const providerAccessToken = url.searchParams.get('providerAccessToken');
    if (!providerAccessToken) {
      return NextResponse.json({ error: 'Missing tokens in query parameters' }, { status: 401 });
    }
    const response = await getUserSavedSongsServer(providerAccessToken);
    return NextResponse.json(response, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
