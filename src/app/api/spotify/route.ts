import { getUserFavoriteSongs } from '@/lib/spotify';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    // PLEASE FIX THIS IN THE FUTURE URL PARAMETERS ???? WTF
    const url = new URL(request.url);
    const providerAccessToken = url.searchParams.get('providerAccessToken');

    if (!providerAccessToken) {
      return NextResponse.json({ error: 'Missing tokens in query parameters' }, { status: 401 });
    }
    const tracks = await getUserFavoriteSongs(providerAccessToken);
    return NextResponse.json(tracks);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
