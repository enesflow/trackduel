"use client";

import { useUser } from "@/lib/UserContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { current, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && current) {
      router.push("/app");
    }
  }, [current, loading, router]);

  if (loading || current) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Welcome to TrackDuel</h1>
      <p>Please log in to continue.</p>
      <Link href="/auth/login">
        <button>Login</button>
      </Link>
    </div>
  );
}
