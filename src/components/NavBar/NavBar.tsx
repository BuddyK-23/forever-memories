import React from 'react';
import Link from 'next/link';

import ConnectButton from '../ConnectButton';

/**
 * Provides a top navigation bar including links to all pages.
 */
const NavBar: React.FC = () => {
  return (
    <nav className="bg-white shadow-lg sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between">
          <div className="flex space-x-4">
            <Link
              href="/"
              className="flex items-center py-5 px-2 text-gray-700 hover:text-gray-900"
            >
              <span className="font-bold ml-2">Forever Memories</span>
            </Link>
            <Link
              href="/"
              className="flex items-center py-5 p-1 text-gray-700 hover:text-gray-900"
            >
              <span className="font-bold ml-2">Home</span>
            </Link>
            <Link
              href="/"
              className="flex items-center py-5 p-1 text-gray-700 hover:text-gray-900"
            >
              <span className="font-bold ml-2">Memory vaults</span>
            </Link>
            <Link
              href="/"
              className="flex items-center py-5 p-1 text-gray-700 hover:text-gray-900"
            >
              <span className="font-bold ml-2">Feed</span>
            </Link>
            <Link
              href="/"
              className="flex items-center py-5 p-1 text-gray-700 hover:text-gray-900"
            >
              <span className="font-bold ml-2">Marketplace</span>
            </Link>
            <Link
              href="/addMemory"
              className="flex items-center py-5 p-1 text-gray-700 hover:text-gray-900"
            >
              <span className="font-bold m-2 bg-gray-200 text-cyan-500 py-2 px-4 rounded hover:text-cyan-700">
                Add Memory
              </span>
            </Link>
          </div>
          <div className="hidden md:flex items-center space-x-1">
            <ConnectButton />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
