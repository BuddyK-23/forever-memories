"use client";

import React, { useState, useEffect } from "react";
import VaultAssistABI from "@/artifacts/VaultAssist.json";
import {
  useWeb3ModalAccount,
  useWeb3ModalProvider,
} from "@web3modal/ethers5/react";
import { ethers } from "ethers";
import {
  hexToDecimal,
  convertUnixTimestampToCustomDate,
  getUniversalProfileCustomName,
  convertIpfsUriToUrl,
} from "@/utils/format";
import toast, { Toaster } from "react-hot-toast";

import "./index.css";

interface CommentList {
  cid: string;
  username: string;
  content: string;
  date: string;
}

interface CommentProps {
  tokenId: string;
}

const CommentComponent: React.FC<CommentProps> = ({ tokenId }) => {
  const { walletProvider } = useWeb3ModalProvider();
  const { address, isConnected } = useWeb3ModalAccount();
  const [commentCnt, setCommentCnt] = useState<number>();
  const [commentList, setCommentList] = useState<CommentList[]>([]);
  const [commentInput, setCommentInput] = useState<string>(""); // State for comment input
  const [profileName, setProfileName] = useState<string>("");
  const [profileCid, setProfileCid] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    init();
  }, []);

  const fetchProfileName = async (mmtOwner: string) => {
    const profile = await getUniversalProfileCustomName(mmtOwner);
    return profile.profileName;
  };

  const fetchProfileCID = async (mmtOwner: string) => {
    const profile = await getUniversalProfileCustomName(mmtOwner);
    return convertIpfsUriToUrl(profile.cid);
  };

  const init = async () => {
    if (walletProvider) {
      try {
        const ethersProvider = new ethers.providers.Web3Provider(
          walletProvider,
          "any"
        );
        const signer = ethersProvider.getSigner(address);

        const VaultAssist = new ethers.Contract(
          process.env.NEXT_PUBLIC_VAULT_ASSIST_CONTRACT_ADDRESS as string,
          VaultAssistABI.abi,
          signer
        );

        // Get the total number of comments
        const _commentCnt = await VaultAssist.getCommentCount(tokenId);
        setCommentCnt(parseInt(_commentCnt.toString(), 10)); // Convert BigNumber to number

        // Get all comments for the given tokenId
        const [usernames, contents, timestamps] =
          await VaultAssist.getAllComments(tokenId);

        // Use Promise.all to handle asynchronous functions inside map
        const formattedComments: CommentList[] = await Promise.all(
          usernames.map(async (username: string, index: number) => {
            const profileCid = await fetchProfileCID(username);
            console.log("profileCid", profileCid);
            const profileName = await fetchProfileName(username);

            return {
              cid: profileCid,
              username: profileName,
              content: contents[index],
              date: convertUnixTimestampToCustomDate(
                parseInt(timestamps[index].toString(), 10),
                "dd MMM yyyy-HH:mm:ss"
              ),
            };
          })
        );

        // Update the comment list state
        setCommentList(formattedComments);
      } catch (error) {
        console.error("Error fetching comments:", error);
      }
    }
  };

  // Function to handle posting a comment
  const postComment = async () => {
    if (walletProvider) {
      if (!commentInput || !isConnected) {
        alert("Please enter a comment and connect your wallet.");
        return;
      }

      try {
        setLoading(true);
        const ethersProvider = new ethers.providers.Web3Provider(
          walletProvider,
          "any"
        );
        const signer = ethersProvider.getSigner(address);

        const VaultAssist = new ethers.Contract(
          process.env.NEXT_PUBLIC_VAULT_ASSIST_CONTRACT_ADDRESS as string,
          VaultAssistABI.abi,
          signer
        );

        // Call the smart contract function to add a comment
        const tx = await VaultAssist.addComment(tokenId, commentInput);
        await tx.wait();

        // Reset input and update the comments list
        setCommentInput("");
        await init(); // Refresh the comments list
        toast.success("Comment posted successfully!");
      } catch (error) {
        console.error("Error posting comment:", error);
        toast.success("Failed to post comment. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="pb-8">
      <div className="text-xl font-bold py-4">Comments ({commentCnt})</div>
      <div className="postPanel">
        <div className="mb-6">
          <div className="py-2 px-4 mb-4 bg-white rounded-lg rounded-t-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
            <textarea
              id="comment"
              className="px-0 w-full text-sm text-gray-900 border-0 focus:ring-0 focus:outline-none dark:text-white dark:placeholder-gray-400 dark:bg-gray-800"
              placeholder="Write a comment..."
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              required
            />
          </div>
          <button
            onClick={postComment}
            disabled={loading}
            className="inline-flex items-center py-2.5 px-4 text-xs font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800"
          >
            {loading ? "Posting..." : "Post comment"}
          </button>
        </div>
      </div>

      <div className="commentsPanel">
        {commentList.map((comment, index) => (
          <div key={index} className="commentPanelItem my-2">
            <div className="flex gap-2">
              <div>
                <img
                  className="w-6 h-6 rounded-full"
                  src={comment.cid}
                  alt={comment.cid}
                />
              </div>

              <div className="font-semibold">{comment.username}</div>
              <div className="text-gray-500">{comment.date}</div>
            </div>
            <div className="full gap-2 justify-end flex">
              <div className="w-full bg-gray-200 rounded px-2 py-1 flex items-center my-2">
                {comment.content}
              </div>
            </div>
          </div>
        ))}
      </div>
      <Toaster />
    </div>
  );
};

export default CommentComponent;
