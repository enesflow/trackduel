"use client";

import { useState, useEffect } from "react";

export default function FirefoxBanner() {
  const [isFirefox, setIsFirefox] = useState(false);
  useEffect(() => {
    setIsFirefox(/firefox/i.test(navigator.userAgent));
  }, []);

  if (!isFirefox) return null;

  return (
    <div className="bg-orange-500 text-white py-2 text-center font-semibold tracking-wide z-50 relative">
      Firefox is not supported. Please use a different browser.
    </div>
  );
}
