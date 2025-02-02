"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { AiOutlineLike, AiOutlineDislike, AiOutlineComment } from "react-icons/ai";

interface MomentCardProps {
  title: string; // Moment name (e.g., "Holiday in Paris")
  description: string; // Moment description
  image: string; // IPFS URL of image
  owner: string; // Owner's address
  address: string;
  link: string; // Link to the moment page
}

const MomentCard: React.FC<MomentCardProps> = ({
  title,
  description,
  image,
  owner,
  address,
  link,
}) => {
  // Convert the IPFS URL to an HTTP-accessible URL
  const convertIpfsToGatewayUrl = (ipfsUrl: string): string => {
    return ipfsUrl.replace("ipfs://", "https://api.universalprofile.cloud/ipfs/");
  };

  // Convert the image IPFS URI
  const imageUrl = image ? convertIpfsToGatewayUrl(image) : "/fallback-image.jpg"; // Fallback image
  console.log("imageUrl", imageUrl);

  return (
    <div className="flex flex-col bg-gray-900/50 rounded-lg shadow-lg hover:shadow-2xl transition-all overflow-hidden">
      {/* Image Section */}
      <Link href={link} className="w-full">
          <Image
            src={imageUrl}
            alt={title || "Untitled Moment"} // Provide a fallback title
            width={300}
            height={200}
            className="w-full h-48 object-cover cursor-pointer hover:opacity-90 transition-opacity duration-300"
          />
      </Link>

      {/* Details Section */}
      <div className="p-4 flex flex-col justify-between h-full">
        {/* Moment Title and Description */}
        <div>
          <Link href={link}>
            <h3 className="text-2xl font-bold text-gray-200 hover:text-primary-500 transition-colors line-clamp-2">
              {title || "Untitled Collection"}
            </h3>
          </Link>
          <p className="text-gray-400 text-sm mt-2 line-clamp-3">
            {description || "No description available."}
          </p>
        </div>

        {/* Bottom Section: Owner */}
        <div className="flex justify-between items-center mt-4">
          <Link href={link} className="text-sm text-primary-600 hover:text-primary-500">
            View Moment
          </Link>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-200">{owner || "Unknown Owner"}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MomentCard;
