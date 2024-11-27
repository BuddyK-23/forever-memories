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
import { SiTruenas } from "react-icons/si";

interface CommentList {
  cid: string;
  username: string;
  content: string;
  date: string;
}

interface CommentComponentProps {
  tokenId: string;
  isMember: boolean;
  onMessageToParent?: (msg: string) => void; // Optional callback for parent communication
}

const CommentComponent: React.FC<CommentComponentProps> = ({
  tokenId,
  isMember,
  onMessageToParent,
}) => {
  const { walletProvider } = useWeb3ModalProvider();
  const { address, isConnected } = useWeb3ModalAccount();
  const [commentCnt, setCommentCnt] = useState<number>();
  const [commentList, setCommentList] = useState<CommentList[]>([]);
  const [commentInput, setCommentInput] = useState<string>(""); // State for comment input
  const [profileName, setProfileName] = useState<string>("");
  const [profileCid, setProfileCid] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

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
        setIsDownloading(true);
      } catch (error) {
        console.error("Error fetching comments:", error);
      }
    }
  };

  // Function to handle posting a comment
  const postComment = async () => {
    console.log("isMember", isMember);
    if (!isMember) {
      toast.error("Please join this vault!");
      return;
    }

    setIsDownloading(false);
    if (walletProvider) {
      if (!commentInput) {
        toast.error("Please enter a comment.");
        return;
      }

      try {
        setLoading(true);
        setIsDownloading(!isDownloading);
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
        console.log("loading state", isDownloading);

        setCommentInput("");
        await init(); // Refresh the comments list

        if (onMessageToParent) {
          const msg = "comment increase";
          onMessageToParent(msg);
        }

        toast.success("Comment posted successfully!");
      } catch (error) {
        console.error("Error posting comment:", error);
        toast.success("Failed to post comment. Please try again.");
      } finally {
        setLoading(false);
        setIsDownloading(true);
      }
    } else {
      toast.error("Connect your wallet.");
      setIsDownloading(true);
    }
  };

  return !isDownloading ? (
    <div className="flex space-x-2 justify-center items-center bg-white h-[300px] dark:invert">
      <span className="sr-only">Loading...</span>
      <div className="h-8 w-8 bg-black rounded-full animate-bounce [animation-delay:-0.3s]"></div>
      <div className="h-8 w-8 bg-black rounded-full animate-bounce [animation-delay:-0.15s]"></div>
      <div className="h-8 w-8 bg-black rounded-full animate-bounce"></div>
    </div>
  ) : (
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
