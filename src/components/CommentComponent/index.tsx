"use client";

import Link from "next/link";
import React, { useState, useEffect } from "react";
import "./index.css";

interface Comment {
  name: string;
  imageURI: string;
  date: string;
  comment: string;
}

const CommentComponent = () => {
  return (
    <div className="pb-8">
      <div className="text-xl font-bold py-4">Comments (20)</div>
      <div className="postPanel">
        <div className="mb-6">
          <div className="py-2 px-4 mb-4 bg-white rounded-lg rounded-t-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
            <textarea
              id="comment"
              className="px-0 w-full text-sm text-gray-900 border-0 focus:ring-0 focus:outline-none dark:text-white dark:placeholder-gray-400 dark:bg-gray-800"
              placeholder="Write a comment..."
              required
            />
          </div>
          <button className="inline-flex items-center py-2.5 px-4 text-xs font-medium text-center text-white bg-blue-700 rounded-lg  hover:bg-blue-800">
            Post comment
          </button>
        </div>
      </div>
      <div className="commentsPanel">
        <div className="commentPanelItem">
          <div className="flex gap-2">
            <div>
              <img
                className="mr-2 w-6 h-6 rounded-full"
                src="https://flowbite.com/docs/images/people/profile-picture-2.jpg"
                alt="Michael Gough"
              />
            </div>
            <div className="font-semibold">Michael Gough</div>
            <div className="text-gray-500">13-05-2024 14:33</div>
          </div>
          <div className="full gap-2 justify-end flex">
            <div className="w-1/12"></div>
            <div className="w-full bg-gray-200 rounded px-2 py-1 flex items-center">Bril</div>
            <div className="w-1/24 text-right">
              <button className="inline-flex items-center py-2.5 px-4 text-xs font-medium text-center text-black bg-gray-200 rounded  hover:bg-gray-300">
                ...
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommentComponent;
