"use client";
import { OAuthProvider } from "appwrite";
import { createContext, useContext, useEffect, useState } from "react";
import { account } from "./appwrite";

type User = null | Record<string, any>; // You can replace Record<string, any> with the actual user/session type from Appwrite if available

const UserContext = createContext<{
  current: User;
  loading: boolean;
  loginWithSpotify: () => void;
  logout: () => Promise<void>;
}>({
  current: null,
  loading: false,
  loginWithSpotify: () => {},
  logout: async () => {},
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
  return user;
}

interface UserProviderProps {
  children: React.ReactNode;
}

export function UserProvider(props: UserProviderProps) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User>(null);

  async function logout() {
    await account.deleteSession("current");
    setUser(null);
  }

  async function init() {
    try {
      const loggedIn = await account.get();
      console.log("Logged in user:", loggedIn);
      setUser(loggedIn);
    } catch (err) {
      console.error("Error fetching user:", err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function loginWithSpotify() {
    await account.createOAuth2Session(
      OAuthProvider.Spotify, // provider
      "http://localhost:3000/app" // redirect here on success
      //"http://localhost:3000/404" // redirect here on failure
      // ["repo", "user"] // scopes (optional)
    );
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
      }}
    >
      {props.children}
    </UserContext.Provider>
  );
}
