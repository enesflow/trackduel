import { adminAccount, adminUsers } from "./appwriteAdmin";
import { getTokenFromAuthHeader } from "./authorizationHeader";


export async function getAndVerifyProviderAccessTokenFromHeader(
  headers: Headers
) {
  const providerAccessToken = getTokenFromAuthHeader(headers);
  const userID = headers.get("userID");
  if (!providerAccessToken) {
    throw new Error("Missing provider access token in headers");
  } else if (!userID) {
    throw new Error("Missing user ID in headers");
  }
  const sessions = await adminUsers.listSessions(userID)
  if (sessions.total === 0) {
    throw new Error("No active sessions found for user");
  }
  // make sure there is a session whose providerAccessToken matches the one in the header
  const session = sessions.sessions.find(
    (session) => session.providerAccessToken === providerAccessToken.token
  );
  if (!session) {
    throw new Error("401 Unauthorized: Session not found for the provided access token");
  }
  // If the session is found, return the provider access token
  return {
    providerAccessToken: providerAccessToken.token,
    userID: userID,
  };
}
