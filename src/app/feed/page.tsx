"use client";

import { useEffect } from "react";
import { ERC725 } from "@erc725/erc725.js";
import LSP5Schema from "@erc725/erc725.js/schemas/LSP5ReceivedAssets.json";
import { useWeb3ModalAccount } from "@web3modal/ethers5/react";

const Feed: React.FC = () => {
  const { address, isConnected } = useWeb3ModalAccount();

  useEffect(() => {
    async function init() {
      if (address) {
        const erc725js = new ERC725(
          LSP5Schema,
          "0xd72251143cbcb6fee8295dec34633231497c1111",
          process.env.NEXT_PUBLIC_MAINNET_URL
        );

        const result = await erc725js.getData("LSP5ReceivedAssets[]");
        console.log("result", result);
      }
    }
    init();
  }, [isConnected]);

  return (
    <div>
      <h1>My LSP8 Collections</h1>
    </div>
  );
};

export default Feed;
