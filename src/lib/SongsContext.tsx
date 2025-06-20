import { databases } from "@/lib/appwrite";
import { DatabaseSong } from "@/lib/appwriteAdmin";
import { useLoggedInUser } from "@/lib/UserContext";
import { Query } from "appwrite";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { MAX_SONGS_FOR_USER } from "./constants";

export type SongsContextType = {
  songs: DatabaseSong[];
  setSongs: React.Dispatch<React.SetStateAction<DatabaseSong[]>>;
  loading: boolean;
  refreshSongs: () => Promise<void>;
  sortSongsByElo: () => void;
};

const SongsContext = createContext<SongsContextType | undefined>(undefined);

export const SongsProvider = ({ children }: { children: ReactNode }) => {
  const user = useLoggedInUser();
  const [songs, setSongs] = useState<DatabaseSong[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshSongs = async () => {
    if (!user.current) return;
    setLoading(true);
    try {
      const res = await databases.listDocuments("db", "songs", [
        Query.equal("user_id", user.current.$id),
        Query.orderDesc("elo"),
        Query.limit(MAX_SONGS_FOR_USER),
      ]);
      setSongs(res.documents as unknown as DatabaseSong[]);
    } finally {
      setLoading(false);
    }
  };

  const sortSongsByElo = () => {
    setSongs((prevSongs) =>
      [...prevSongs].sort((a, b) => (b.elo ?? 0) - (a.elo ?? 0))
    );
  };

  useEffect(() => {
    refreshSongs();
  }, [user.current]);

  return (
    <SongsContext.Provider
      value={{ songs, setSongs, loading, refreshSongs, sortSongsByElo }}
    >
      {children}
    </SongsContext.Provider>
  );
};

export const useSongs = () => {
  const context = useContext(SongsContext);
  if (!context) {
    throw new Error("useSongs must be used within SongsProvider");
  }
  return context;
};
