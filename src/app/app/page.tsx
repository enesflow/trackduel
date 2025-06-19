"use client";

import { useLoggedInUser } from "@/lib/UserContext";

export default function HomePage() {
  const user = useLoggedInUser();

  return (
    <div>
      <p>Welcome to the Home Page, {user.current.name}!</p>
    </div>
  );
}
