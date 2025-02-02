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
      {/* <div className="animated-balls">
        <div className="ball ball1"></div>
        <div className="ball ball2"></div>
        <div className="ball ball3"></div>
      </div> */}

      {/* Content */}
      <div className="container mx-auto max-w-6xl h-screen px-4 lg:px-0 flex flex-col items-center text-center justify-center relative z-10">
        <div className="text-white">
          <h2 className="text-6xl text-gray-200 font-bold mb-3">Capture the <span className="text-pink-400 italic">moment</span></h2>
          <p className="text-xl text-gray-200 mb-10 max-w-[740px]">
          Own your moments, preserve your truth. A decentralized archive of life’s most authentic stories, forever secured for generations to come.
          </p>
          <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0 mt-6 justify-center items-center">
            {/* <a
              href="/create-collection"
              className="px-6 py-3 bg-gray-300 text-gray-800 rounded-xl shadow-md hover:bg-gray-400"
            >
              Create a collection
            </a> */}
            <a
              href="/collections"
              className="px-6 py-3 bg-pink-100 text-gray-800 rounded-xl shadow-md hover:bg-pink-200"
            >
              Explore collections
            </a>
          </div>
        </div>

        {/* <div className="mt-16 max-w-lg">
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
        </div> */}
      </div>
    </main>
  );
}
