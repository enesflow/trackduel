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
  getSession: () => Promise<Models.Session | null>;
};
const UserContext = createContext<UserContextType>({
  current: null,
  loading: false,
  loginWithSpotify: () => {},
  loginWithGoogle: () => {},
  logout: async () => {},
  getSession: async () => null,
});

export function useUser() {
  return useContext(UserContext);
}

export function useLoggedInUser(): UserContextType & { current: User } {
  const user = useUser();
  if (user.loading) {
    throw new Error("User context is still loading");
  } else if (!user.current) {
    throw new Error("User is not logged in");
  }
  return user as UserContextType & { current: User };
}

interface UserProviderProps {
  children: React.ReactNode;
}

export function UserProvider(props: UserProviderProps) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  async function logout() {
    await account.deleteSession("current");
    setUser(null);
  }

  async function init() {
    try {
      const loggedIn = await account.get();

      setUser(loggedIn);
    } catch (err) {
      //console.error("Error fetching user:", err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  function loginWithSpotify() {
    account.createOAuth2Session(
      OAuthProvider.Spotify,
      "http://localhost:3000/app/add",
      "http://localhost:3000/404",
      ["user-library-read"]
    );
  }

  function loginWithGoogle() {
    account.createOAuth2Session(
      OAuthProvider.Google,
      "http://localhost:3000/app/add",
      "http://localhost:3000/404",
      ["https://www.googleapis.com/auth/youtube.readonly"]
    );
  }

  async function getSession() {
    try {
      const session = await account.getSession("current");
      console.log("Current session:", session);
      return session;
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
      }}
    >
      {props.children}
    </UserContext.Provider>
  );
}
