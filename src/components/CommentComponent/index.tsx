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
    <div className="flex flex-col space-x-2 justify-center items-center bg-gray-900 h-[300px] dark:invert">
      <div className="flex space-x-2 justify-center items-center">
        <div
          className="h-8 w-8 rounded-full animate-bounce [animation-delay:-0.3s]"
          style={{
            backgroundImage: "radial-gradient(circle at top left, #1E3A8A, #60A5FA)",
          }}
        ></div>
        <div
          className="h-8 w-8 rounded-full animate-bounce [animation-delay:-0.15s]"
          style={{
            backgroundImage: "radial-gradient(circle at top left, #1E3A8A, #60A5FA)",
          }}
        ></div>
        <div
          className="h-8 w-8 rounded-full animate-bounce"
          style={{
            backgroundImage: "radial-gradient(circle at top left, #1E3A8A, #60A5FA)",
          }}
        ></div>
      </div>
      <div className="flex flex-col items-center text-center max-w-[360px] mx-auto">
        <p className="text-base mt-8">Adding your comment to the Moment</p>
      </div>
    </div>
  ) : (
    <div className="relative">
      
      <div className="commentsPanel max-h-[240px] overflow-y-auto">
        {commentList.map((comment, index) => (
          <div key={index} className="commentPanelItem my-2">
            <div className="flex items-start gap-2 mb-6">
              <div className="min-w-8">
                <img
                  className="w-8 h-8 rounded-full object-cover aspect-square"
                  src={comment.cid}
                  alt={comment.cid}
                />
              </div>
              <div className="flex flex-col gap-1">
                <div className="text-sm">{comment.username}</div>
                <div className="text-base w-full bg-gray-900 rounded whitespace-pre-wrap">
                  {comment.content}
                </div>
                <div className="text-gray-400 text-sm">{comment.date}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="postPanel">
        <div className="flex flex-col items-center">
          <div className="py-2 px-4 mb-4 rounded-lg w-full rounded-t-lg border bg-gray-800 border-gray-700 z-50">
            <textarea
              id="comment"
              className="px-0 w-full text-base border-0 focus:ring-0 focus:outline-none text-gray-400 placeholder-gray-400 bg-gray-800 z-50"
              placeholder="Write a comment..."
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              required
            />
          </div>
          <button
            onClick={postComment}
            disabled={loading}
            className="inline-flex items-center py-3 px-3 text-base text-center text-gray-200 bg-gray-700 rounded-lg hover:bg-gray-600 z-50 justify-center w-full"
          >
            {loading ? "Posting..." : "Add comment"}
          </button>
        </div>
      </div>

      
      <Toaster />
    </div>
  );
};

export default CommentComponent;
