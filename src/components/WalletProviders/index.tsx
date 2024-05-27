import { useState } from "react";
import { useSyncProviders } from "@/hooks/useSyncProviders";
import { formatAddress } from "@/utils";
/////////////////////////////////////////
import LSP4DigitalAsset from "@erc725/erc725.js/schemas/LSP4DigitalAsset.json";
import { ERC725 } from "@erc725/erc725.js";
import { ethers } from "ethers";
import LSP8Collection from "@/smartcontracts/artifacts/LSP8Collection.json";

export const DiscoverWalletProviders = () => {
  const [selectedWallet, setSelectedWallet] = useState<EIP6963ProviderDetail>();
  const [userAccount, setUserAccount] = useState<string>("");
  const providers = useSyncProviders();

  const handleConnect = async (providerWithInfo: EIP6963ProviderDetail) => {
    try {
      let provider;
      if (providerWithInfo.info.name == "MetaMask") {
        provider = new ethers.BrowserProvider(window.ethereum);
      } else if (providerWithInfo.info.name == "Universal Profile") {
        provider = new ethers.BrowserProvider(window.lukso);
      } else {
        console.log("Unknown provider");
        return;
      }

      const accounts = await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner(accounts[0]);

      const contractAddress = "0x104a441ece8292f554f90b68533e94d05344faf9";
      const contractABI = LSP8Collection.abi;
      const LSP8Contract = new ethers.Contract(
        contractAddress,
        contractABI,
        signer
      );
      const owner = await LSP8Contract.owner();
      console.log("owner", owner);

      // const tx = await LSP8Contract.mint(
      //   "Day2 Selfie",
      //   "DS2",
      //   1, //token type, if 1, NFT
      //   true, // isNonDivisible
      //   10, // totalSupplyofLSP7
      //   "0xeE1d780150f92967743aB4Fd9F807c486DE2E9E6", //receiverOfInitialTokens_
      //   "0x00006f357c6a002003919e2c9f21869ea7beabc3dfbef99dfefe81df93dc373288fa6730b778e22e697066733a2f2f516d63775946684750374b426f316134457662427875764466336a513262773164664d456f764154524a5a657458"
      //   // encodeLSP7Metadata.values[0]
      // );
      // await tx.wait();
      // console.log("here", tx);
      //////////////////////////////////////////
      // ----- LSP7 Collection Metadata ----- //

      // const lsp7SubCollectionMetadata = {
      //   LSP4Metadata: {
      //     // name: 'Daily Selfie',
      //     headline: "headline",
      //     description: "description",
      //     links: [],
      //     icons: [
      //       {
      //         width: 256,
      //         height: 256,
      //         url: "ipfs://QmS3jF9jsoG6gnyJ7wCeJ4bej2aJEnPSv527UV8KxjBDAA",
      //         verification: {
      //           method: "keccak256(bytes)",
      //           data: "0xdd6b5fb6dc984fda0222fb6f6e96b471c0667b12f03b1e804f7b5e6ab62acdb0",
      //         },
      //       },
      //     ],
      //     images: [
      //       [
      //         {
      //           width: 1024,
      //           height: 974,
      //           url: "ipfs://QmUGmycxrwFec15UC41v9bvnRStK3zxR7mth72mGRcUSPD",
      //           verification: {
      //             method: "keccak256(bytes)",
      //             data: "0x951bf983a4b7bcebc5c0b00a5e783630dcb788e95ee9e44b0b7d4bde4a0b4d81",
      //           },
      //         },
      //       ],
      //     ],
      //     assets: [
      //       {
      //         verification: {
      //           method: "keccak256(bytes)",
      //           data: "0x88f3d704f3d534267c564019ce2b70a5733d070e71bf2c1f85b5fc487f47a46f",
      //         },
      //         url: "ifps://QmTDQGR26dSd3c4qJpmFwTh7gNRPnNbBf2Fg3gULypUag3",
      //         fileType: "jpg",
      //       },
      //     ],
      //     attributes: [],
      //   },
      // };
      // const lsp7SubCollectionMetadataCID =
      //   "ipfs://QmagrdYWUFyg8Y3P3Zyxcefomf3ZydNZevrtix3ArTPQRx";
      // const erc725 = new ERC725(LSP4DigitalAsset, "", "", {});
      // const encodeLSP7Metadata = erc725.encodeData([
      //   {
      //     keyName: "LSP4Metadata",
      //     value: {
      //       json: lsp7SubCollectionMetadata,
      //       url: lsp7SubCollectionMetadataCID,
      //     },
      //   },
      // ]);
      // console.log("encodeLSP7Metadata", encodeLSP7Metadata.values[0]);
      // const LSP8CollectionContractAddress =
      //   "0x418c7f6C5ae5Fd5D9a3006CD194565aB7846250e";
      // const LSP8Contract = new ethers.Contract(
      //   LSP8CollectionContractAddress,
      //   LSP8Collection.abi,
      //   provider
      // );

      // const tx = await LSP8Contract.mint(
      //   "Day1 Selfie",
      //   "DS1",
      //   1, //token type, if 1, NFT
      //   true, // isNonDivisible
      //   3, // totalSupplyofLSP7
      //   "0xC8F13A26dF13fEf789Eaa809916e06b7B24F08Bd", //receiverOfInitialTokens_
      //   "0x00006f357c6a002003919e2c9f21869ea7beabc3dfbef99dfefe81df93dc373288fa6730b778e22e697066733a2f2f516d63775946684750374b426f316134457662427875764466336a513262773164664d456f764154524a5a657458"
      //   // encodeLSP7Metadata.values[0]
      // );
      // await tx.wait();
      // console.log("here", tx);

      ////////////////////////////////////////////////////////
      // setSelectedWallet(providerWithInfo);
      // setUserAccount(accounts?.[0]);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      <h2>Wallets Detected:</h2>
      <div>
        {providers.length > 0 ? (
          providers?.map((provider: EIP6963ProviderDetail) => (
            <button
              key={provider.info.uuid}
              onClick={() => handleConnect(provider)}
            >
              <img src={provider.info.icon} alt={provider.info.name} />
              <div>{provider.info.name}</div>
            </button>
          ))
        ) : (
          <div>No Announced Wallet Providers</div>
        )}
      </div>
      <hr />
      <h2>{userAccount ? "" : "No "}Wallet Selected</h2>
      {/* {userAccount && (
        <div>
          <div>
            <img
              src={selectedWallet.info.icon}
              alt={selectedWallet.info.name}
            />
            <div>{selectedWallet.info.name}</div>
            <div>({formatAddress(userAccount)})</div>
          </div>
        </div>
      )} */}
    </>
  );
};
