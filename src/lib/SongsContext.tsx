import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { databases } from "@/lib/appwrite";
import { DatabaseSong } from "@/lib/appwriteAdmin";
import { useLoggedInUser } from "@/lib/UserContext";
import { Query } from "appwrite";

type SongsContextType = {
  songs: DatabaseSong[];
  setSongs: React.Dispatch<React.SetStateAction<DatabaseSong[]>>;
  loading: boolean;
  refreshSongs: () => Promise<void>;
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
        Query.limit(50),
      ]);
      setSongs(res.documents as unknown as DatabaseSong[]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshSongs();
  }, [user.current]);

  return (
    <SongsContext.Provider value={{ songs, setSongs, loading, refreshSongs }}>
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
