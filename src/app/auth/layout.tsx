"use client";

import { useUser } from "@/lib/UserContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  const user = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!user.loading && user.current) {
      router.push("/app");
    }
  }, [user, router]);

  if (user.loading) {
    return <div>Loading...</div>;
  }

  if (user.current) {
    return null; // or a loading spinner while redirecting
  }

  return <>{children}</>;
}
