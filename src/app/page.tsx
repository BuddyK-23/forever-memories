"use client";

import React from "react";
import "./index.css";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 bg-black"
        style={{
          backgroundImage: `url('/fm-bg-main.png')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          zIndex: -2, // Ensure background stays at the very back
        }}
      ></div>

      {/* Animated Balls */}
      <div className="animated-balls">
        <div className="ball ball1"></div>
        <div className="ball ball2"></div>
        <div className="ball ball3"></div>
      </div>

      {/* Content */}
      <div className="container mx-auto max-w-6xl h-screen px-2 flex flex-col justify-center relative z-10">
        <div className="text-white">
          <h2 className="text-5xl text-gray-200 font-bold mb-6">Capture today, inspire tomorrow</h2>
          <p className="text-xl text-gray-300 mb-10">
            A social platform to save, share, and shape our collective history
          </p>
          <div className="space-x-4">
            <a
              href="/createVault"
              className="px-6 py-3 bg-primary-600 text-gray-200 rounded-lg shadow-md hover:bg-primary-500"
            >
              Create a private collection →
            </a>
            <a
              href="/explore"
              className="px-6 py-3 bg-gray-700 text-gray-200 rounded-lg shadow-md hover:bg-gray-600"
            >
              Explore public collections
            </a>
          </div>
        </div>

        <div className="mt-16 max-w-lg">
          <h3 className="text-lg text-gray-400 mb-4">Popular collections</h3>
          <div className="flex flex-wrap gap-3">
            {[
              "Daily Selfie",
              "Behind the Scenes",
              "2025 Time Capsule",
              "Memes",
              "Letters from Rome",
              "Angry Cats",
            ].map((tag, index) => (
              <span
                key={index}
                className="bg-gray-800 text-white px-3 py-1 rounded-full text-sm hover:bg-gray-700"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
