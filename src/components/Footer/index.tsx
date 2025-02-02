"use client";

import Link from "next/link";
import React, { useState, useEffect } from "react";
import { 
  FaTwitter, 
  FaDiscord, 
  FaMedium, 
  FaYoutube 
} from 'react-icons/fa';
import { MdAccountCircle } from 'react-icons/md'; // For Universal Profile Icon
import "./index.css";

const Footer = () => {
  return (
    <div className="flex w-full h-[60px] px-3 text-gray-400 text-sm bg-black">
      
      <div className="container mx-auto max-w-6xl flex justify-between items-center">
        {/* Social Icons Section */}
        <div className="flex space-x-4">
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="hover:text-white">
            <FaTwitter size={20} />
          </a>
          <a href="https://lukso.network/universal-profile" target="_blank" rel="noopener noreferrer" className="hover:text-white">
            <MdAccountCircle size={20} />
          </a>
          <a href="https://discord.com" target="_blank" rel="noopener noreferrer" className="hover:text-white">
            <FaDiscord size={20} />
          </a>
          <a href="https://medium.com" target="_blank" rel="noopener noreferrer" className="hover:text-white">
            <FaMedium size={20} />
          </a>
          <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="hover:text-white">
            <FaYoutube size={20} />
          </a>
        </div>
        
        {/* Links Section */}
        <div className="flex space-x-4">
          <a href="/terms" className="hover:text-white">Terms</a>
          <a href="/policy" className="hover:text-white">Policy</a>
          <a href="/privacy" className="hover:text-white">Privacy</a>
        </div>
      </div>
    </div>
  );
};

export default Footer;
