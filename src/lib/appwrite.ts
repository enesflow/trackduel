import { Account, Client, Databases } from "appwrite";

const NEXT_PUBLIC_APPWRITE_ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const NEXT_PUBLIC_APPWRITE_PROJECT = process.env.NEXT_PUBLIC_APPWRITE_PROJECT;
if (!NEXT_PUBLIC_APPWRITE_ENDPOINT || !NEXT_PUBLIC_APPWRITE_PROJECT) {
  throw new Error(
    "Appwrite endpoint and project ID must be set in environment variables NEXT_PUBLIC_APPWRITE_ENDPOINT and NEXT_PUBLIC_APPWRITE_PROJECT."
  );
}
const client = new Client()
  .setEndpoint(NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(NEXT_PUBLIC_APPWRITE_PROJECT);

const account = new Account(client);
const databases = new Databases(client);

export { client, account, databases };
