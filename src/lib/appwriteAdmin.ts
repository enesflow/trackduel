import { Account, Client, Databases } from "node-appwrite";

const NEXT_PUBLIC_APPWRITE_ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const NEXT_PUBLIC_APPWRITE_PROJECT = process.env.NEXT_PUBLIC_APPWRITE_PROJECT;
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY;
if (!NEXT_PUBLIC_APPWRITE_ENDPOINT || !NEXT_PUBLIC_APPWRITE_PROJECT || !APPWRITE_API_KEY) {
  throw new Error(
    "Appwrite endpoint and project ID must be set in environment variables NEXT_PUBLIC_APPWRITE_ENDPOINT and NEXT_PUBLIC_APPWRITE_PROJECT, and APPWRITE_API_KEY."
  );
}
const adminClient = new Client()
  .setEndpoint(NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(NEXT_PUBLIC_APPWRITE_PROJECT)
  .setKey(APPWRITE_API_KEY);

const adminAccount = new Account(adminClient);
const adminDatabases = new Databases(adminClient);

export { adminClient, adminAccount, adminDatabases };

export type DatabaseSong = {
  spotify_id: string;
  name: string;
  artists: string;
  image_url: string;
  album_name: string;
  elo: number;
}