import Link from "next/link";
import VaultCard from "@/components/VaultCard";
import { FaPlus } from "react-icons/fa6";

interface Vault {
  name: string;
  mements: number;
  memebers: number;
  owner: string;
}

export default function Explore() {
  const vaultData: Vault[] = [
    {
      name: "Humanity",
      mements: 3450,
      memebers: 2204,
      owner: "@buddyk#2345",
    },
    {
      name: "Our World",
      mements: 3450,
      memebers: 2204,
      owner: "@buddyk#2345",
    },
    {
      name: "Daily Selfie",
      mements: 3450,
      memebers: 2204,
      owner: "@buddyk#2345",
    },
    {
      name: "Time Capsule",
      mements: 3450,
      memebers: 2204,
      owner: "@buddyk#2345",
    },
    {
      name: "Memery jar",
      mements: 3450,
      memebers: 2204,
      owner: "@buddyk#2345",
    },
    {
      name: "Our World",
      mements: 3450,
      memebers: 2204,
      owner: "@buddyk#2345",
    },
    {
      name: "Daily Selfie",
      mements: 3450,
      memebers: 2204,
      owner: "@buddyk#2345",
    },
    {
      name: "Time Capsule",
      mements: 3450,
      memebers: 2204,
      owner: "@buddyk#2345",
    },
  ];

  return (
    <div className="px-6 min-h-screen">
      <div className="pt-10">
        <div className="h-[40px] w-[120px] shadow-lg shadow-gray-500/50 rounded-md cursor-pointer flex items-center justify-center  bg-blue-500 hover:bg-blue-400 text-white">
          <Link href={"/createVault"}>
            <div className="flex items-center justify-center gap-2">
              Create New
            </div>
          </Link>
        </div>
      </div>
      <div className="py-10 grid grid-cols-5 gap-4">
        {vaultData.map((vault, index) => (
          <div key={index}>
              <VaultCard vault={vault} />
          </div>
        ))}
      </div>
    </div>
  );
}
