"use client";
import { useUser } from "@/lib/UserContext";

export default function Login() {
  const user = useUser();
  return (
    <div>
      <button
        onClick={async () => {
          await user.loginWithSpotify();
        }}
      >
        Login with Spotify
      </button>
    </div>
  );
}
