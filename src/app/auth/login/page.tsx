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
import { LogIn } from "lucide-react";
import { SiApple, SiGoogle, SiSpotify } from "react-icons/si";

export default function Login() {
  const user = useUser();
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto shadow-lg">
        <CardHeader className="text-center space-y-2">
          <LogIn className="mx-auto h-10 w-10 text-purple-600" />
          <CardTitle className="text-3xl font-bold text-gray-900">
            Welcome Back!
          </CardTitle>
          <CardDescription className="text-gray-600">
            Sign in to access your favorite songs and leaderboards.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant="outline"
            className="w-full py-6 text-lg flex items-center justify-center gap-3 border-gray-300 hover:bg-gray-50 transition-colors"
            onClick={async () => {
              await user.loginWithSpotify();
            }}
          >
            <SiSpotify className="h-6 w-6 text-green-500" />
            Sign in with Spotify
          </Button>
          <Button
            variant="outline"
            className="w-full py-6 text-lg flex items-center justify-center gap-3 border-gray-300"
            disabled
          >
            <SiGoogle className="h-6 w-6 text-blue-500" />
            Sign in with Google
          </Button>
          <Button
            variant="outline"
            className="w-full py-6 text-lg flex items-center justify-center gap-3 border-gray-300"
            disabled
          >
            <SiApple className="h-6 w-6 text-gray-800" />
            Sign in with Apple
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
