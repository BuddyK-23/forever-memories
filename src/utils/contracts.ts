import { ethers } from "ethers";
import { useContext, useMemo } from "react";
import { UPConnectionContext } from "@/contexts/UPConnectionContext";
import MomentFactoryArtifact from "../../src/artifacts/MomentFactory.json";

export const useMomentFactoryContract = () => {
  const { provider } = useContext(UPConnectionContext);

  // If no provider is available, return null
  if (!provider) {
    console.warn("Provider is not available in UPConnectionContext.");
    return null;
  }

  const momentFactoryAddress = process.env.NEXT_PUBLIC_MOMENT_FACTORY_ADDRESS;
  
  // If MomentFactory address is not set, return null
  if (!momentFactoryAddress) {
    console.error("MomentFactory address is not set.");
    return null;
  }

  return new ethers.Contract(
    momentFactoryAddress,
    MomentFactoryArtifact.abi, // ABI from MomentFactory.json
    provider
  );
};