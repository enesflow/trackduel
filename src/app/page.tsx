"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useUser } from "@/lib/UserContext";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Home() {
  const { current, loading } = useUser();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 shadow-lg">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-4xl">TrackDuel</CardTitle>
          <CardDescription className="text-lg">
            Battle your favorite songs, find the absolute best!
          </CardDescription>
        </CardHeader>

        <CardContent className="mt-6 flex flex-col space-y-4 items-center">
          {loading ? (
            <Button disabled>Loading...</Button>
          ) : current ? (
            <Button onClick={() => router.push("/app")}>
              Continue as {current.name.split(" ")[0]}
            </Button>
          ) : (
            <Link href="/auth/login">
              <Button>Get Started</Button>
            </Link>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
