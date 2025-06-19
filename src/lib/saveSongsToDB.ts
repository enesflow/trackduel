import { UserContextType } from "./UserContext";
import { fetchNextJSAPIWithToken } from '@/lib/fetch';

export async function saveSongsToDB(
  user: UserContextType
) {
  const session = await user.getSession();
  if (!session || !session.provider) {
    throw new Error("User session is not valid or does not have a provider.");
  }
  if (session.provider === "spotify") {
    return await fetchNextJSAPIWithToken<string[]>(
      "/spotify/save-songs-to-db",
      user
    );
  } else {
    throw new Error("Unsupported provider for saving songs.");
  }
}