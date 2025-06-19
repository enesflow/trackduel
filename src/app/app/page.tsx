"use client";

import { useLoggedInUser } from "@/lib/UserContext";
import { useState } from "react";

export default function HomePage() {
  const [songs, setSongs] = useState<string[]>([]);
  const user = useLoggedInUser();

  return (
    <div>
      <p>Welcome to the Home Page, {user.current.name}!</p>
    </div>
  );
}
