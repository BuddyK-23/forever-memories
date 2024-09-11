"use client";

import { useState, useEffect } from "react";

export default function Profile() {
  const [isDownloading, setIsDownloading] = useState<boolean>(true);

  return !isDownloading ? (
    <div className="flex space-x-2 justify-center items-center bg-gray-200 h-screen dark:invert">
      <span className="sr-only">Loading...</span>
      <div className="h-8 w-8 bg-black rounded-full animate-bounce [animation-delay:-0.3s]"></div>
      <div className="h-8 w-8 bg-black rounded-full animate-bounce [animation-delay:-0.15s]"></div>
      <div className="h-8 w-8 bg-black rounded-full animate-bounce"></div>
    </div>
  ) : (
    <main className="flex flex-col items-center justify-between p-24">
      Feed
    </main>
  );
}
