"use client";

import { useState, useEffect } from "react";

export default function Profile() {
  const [isDownloading, setIsDownloading] = useState<boolean>(true);
  const [blobUrl, setBlobUrl] = useState<string>("");

  useEffect(() => {
    const fetchUrl = "https://plum-certain-marten-441.mypinata.cloud/ipfs/QmUs8Q3JBLPYkJyDERNgE8uMG3N5KuCWAFGdZ5of6Lr4AJ";
    fetch(fetchUrl)
      .then((res) => res.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        console.log("url", url);
        setBlobUrl("url")
      })
      .catch((error) => console.error("Error creating blob:", error));
  }, []);

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
      <div className="w-full h-[600px] rounded border-8 border-indigo-100 shadow-lg shadow-gray-500/50">
        <img
          className="carousel-item w-full h-[584px]"
          src={blobUrl}
          alt="moment image"
        />
      </div>
    </main>
  );
}
