"use client";

import { useState, useEffect } from "react";

export default function FirefoxBanner() {
  const [isFirefox, setIsFirefox] = useState(false);
  useEffect(() => {
    // Suppress hydration warning and use more reliable detection
    setIsFirefox(
      typeof window !== "undefined" && /firefox/i.test(navigator.userAgent)
    );
  }, []);
  return (
    <div
      className="bg-orange-500 text-white py-2 text-center font-semibold tracking-wide z-[9999] relative"
      role="alert"
      aria-live="polite"
    >
      Firefox is not supported. Please use a different browser.
    </div>
  );
}
