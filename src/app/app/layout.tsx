"use client";

import { useUser } from "@/lib/UserContext";
import { useRouter } from "next/navigation";
import { useEffect, ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SongsProvider } from "@/lib/SongsContext";

export default function AuthLayout({ children }: { children: ReactNode }) {
  const user = useUser();
  const router = useRouter();

  const pathname = usePathname();

  useEffect(() => {
    if (!user.loading && !user.current) {
      router.push("/auth/login");
    }
  }, [user, router]);

  if (user.loading) {
    return <div>Loading...</div>;
  }

  if (!user.current) {
    return null;
  }

  const PATHS = {
    leaderboard: "/app/leaderboard",
    play: "/app/play",
    add: "/app/add",
  };

  // Determine active tab based on pathname
  let activeTab: "leaderboard" | "play" | "add" = "leaderboard";
  if (pathname.startsWith(PATHS.play)) {
    activeTab = "play";
  } else if (pathname.startsWith(PATHS.add)) {
    activeTab = "add";
  } else if (pathname.startsWith(PATHS.leaderboard)) {
    activeTab = "leaderboard";
  }

  return (
    <SongsProvider>
      <nav className="w-full flex justify-center py-4">
        <Tabs value={activeTab} className="w-full max-w-md">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="leaderboard" asChild>
              <Link href={PATHS.leaderboard}>Leaderboard</Link>
            </TabsTrigger>
            <TabsTrigger value="play" asChild>
              <Link href={PATHS.play}>Play</Link>
            </TabsTrigger>
            <TabsTrigger value="add" asChild>
              <Link href={PATHS.add}>Add Songs</Link>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </nav>
      {children}
    </SongsProvider>
  );
}
