import type { EnvGetter } from "@builder.io/qwik-city/middleware/request-handler";
import {
  Client as AdminClient,
  Account as AdminAccount,
  Databases as AdminDatabases,
  ID as AdminID,

} from "node-appwrite";
import {
  Client as UserClient,
  Account as UserAccount,
  Databases as UserDatabases,
  ID as UserID,
} from "appwrite";
import { $ } from '@builder.io/qwik';

const APPWRITE_PROJECT_ID = "6853015d002ab02291d2";
const APPWRITE_ENDPOINT = "https://fra.cloud.appwrite.io/v1";


export const getAdminClient = (env: EnvGetter) => {
  // validate environment variables
  const APPWRITE_API_KEY = env.get("APPWRITE_API_KEY");
  if (!APPWRITE_API_KEY) {
    throw new Error("Missing required environment variables: APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY");
  }
  return new AdminClient()
    .setEndpoint(APPWRITE_ENDPOINT!)
    .setProject(APPWRITE_PROJECT_ID!)
    .setKey(APPWRITE_API_KEY!);
};

export const getUserClient = $(() => {
  return new UserClient()
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID);
})

export { AdminAccount, AdminDatabases, AdminID };
export { UserAccount, UserDatabases, UserID };