import { Account, Client, Databases, Users } from "node-appwrite";

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
const adminUsers = new Users(adminClient);

export { adminClient, adminAccount, adminDatabases, adminUsers };

/**
 * Represents a song entry in the database with associated metadata.
 * The user_id and spotify_id together have a unique index to prevent duplicate entries by the same user.
 *
 * @property user_id - The unique identifier of the user who added the song.
 * @property spotify_id - The Spotify ID of the song.
 * @property name - The name/title of the song.
 * @property artists - The artist(s) of the song, as a string.
 * @property image_url - The URL to the song's album artwork or image.
 * @property album_name - The name of the album the song belongs to.
 * @property elo - The ELO rating of the song, used for ranking.
 */
export type DatabaseSong = {
  user_id: string;
  spotify_id: string;
  name: string;
  artists: string;
  image_url: string;
  album_name: string;
  elo: number;
}