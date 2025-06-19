"use client";
import { Models, OAuthProvider } from "appwrite";
import { createContext, useContext, useEffect, useState } from "react";
import { account } from "./appwrite";

type User = Models.User<Models.Preferences>;
export type UserContextType = {
  current: User | null;
  loading: boolean;
  loginWithSpotify: () => void;
  loginWithGoogle: () => void;
  logout: () => Promise<void>;
  session: Models.Session | null;
  getSession: () => Promise<Models.Session | null>;
};
const UserContext = createContext<UserContextType>({
  current: null,
  loading: false,
  loginWithSpotify: () => {},
  loginWithGoogle: () => {},
  logout: async () => {},
  session: null,
  getSession: async () => null,
});

export function useUser() {
  return useContext(UserContext);
}

export function useLoggedInUser() {
  const user = useUser();
  if (user.loading) {
    throw new Error("User context is still loading");
  } else if (!user.current) {
    throw new Error("User is not logged in");
  }
  return user as UserContextType & {
    current: User;
    session: Models.Session;
    loading: false;
  };
}

interface UserProviderProps {
  children: React.ReactNode;
}

export function UserProvider(props: UserProviderProps) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Models.Session | null>(null);

  function createOAuth2Session(provider: OAuthProvider) {
    const redirectUrl = `${process.env.NEXT_PUBLIC_HOST}/app/add`;
    const failureUrl = `${process.env.NEXT_PUBLIC_HOST}/404`;
    let scopes: string[] = [];
    if (provider === OAuthProvider.Spotify) {
      scopes = ["user-library-read"];
    } else if (provider === OAuthProvider.Google) {
      scopes = ["https://www.googleapis.com/auth/youtube.readonly"];
    }
    return account.createOAuth2Session(
      provider,
      redirectUrl,
      failureUrl,
      scopes
    );
  }

  async function logout() {
    await account.deleteSession("current");
    setUser(null);
  }

  async function init() {
    try {
      const loggedIn = await account.get();
      await getSession();
      setUser(loggedIn);
    } catch (err) {
      //console.error("Error fetching user:", err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  function loginWithSpotify() {
    createOAuth2Session(OAuthProvider.Spotify);
  }

  function loginWithGoogle() {
    createOAuth2Session(OAuthProvider.Google);
  }

  async function getSession() {
    try {
      const newSession = await account.getSession("current");
      setSession(newSession);
      return newSession;
    } catch (err) {
      console.error("Error fetching current session:", err);
      return null;
    }
  }

  useEffect(() => {
    init();
  }, []);

  return (
    <UserContext.Provider
      value={{
        current: user,
        logout,
        loading,
        loginWithSpotify,
        loginWithGoogle,
        getSession,
        session,
      }}
    >
      {props.children}
    </UserContext.Provider>
  );
}
