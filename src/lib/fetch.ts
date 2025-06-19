import { getAuthorizationHeader } from '@/lib/authorizationHeader';
import { account } from '@/lib/appwrite';
import { throwErrorIfNotOk } from '@/lib/throwErrorIfNotOk';
import { UserContextType } from '@/lib/UserContext';
export async function fetchNextJSAPIWithToken<T>(
  name: string,
  userContext: UserContextType | null
): Promise<T> {
  if (!userContext || !userContext.current) {
    throw new Error("User context is required to fetch API data.");
  }
  let session = await userContext.getSession();
  if (!session?.providerAccessTokenExpiry) {
    throw new Error("Session does not have a valid provider access token expiry.");
  }
  const tokenExpiry = session.providerAccessTokenExpiry;
  // Ensure at least 60 seconds remain before token expiry
  if (!tokenExpiry || (new Date(tokenExpiry).getTime() - Date.now()) < 60 * 1000) {
    session = await account.updateSession("current");
  }
  const response = await fetch(`/api${name}`, {
    headers: {
      ...getAuthorizationHeader(session.providerAccessToken),
      userID: userContext.current.$id,
    },
  });
  const okResponse = await throwErrorIfNotOk(response);
  return okResponse.json() as Promise<T>;
}