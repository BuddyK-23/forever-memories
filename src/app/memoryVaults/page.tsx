import Link from "next/link";
import VaultSlider from "@/components/VaultSlider";
import { FaPlus } from "react-icons/fa6";

export default function Home() {
  return (
    <div className="px-6 min-h-screen">
      {/* <VaultSlider /> */}
      <div className="pt-10">
        <div>Your private memory vaults</div>
        <div className="h-[100px] w-[100px] shadow-lg shadow-gray-500/50 rounded-md cursor-pointer flex items-center justify-center my-3  bg-white">
          <Link href={"/createVault/1"}>
            <div>
              <div className="justify-center item-center flex">
                <FaPlus />
              </div>

              <div className="justify-center item-center flex text-sm">
                Create New
              </div>
            </div>{" "}
          </Link>
        </div>
      </div>
      <div className="pt-8 pb-4">
        <div>Your public memory vaults</div>
        <div className="h-[100px] w-[100px] shadow-lg shadow-gray-500/50 rounded-md cursor-pointer flex items-center justify-center my-2 bg-white">
          <Link href={"/createVault/0"}>
            <div>
              <div className="justify-center item-center flex">
                <FaPlus />
              </div>

              <div className="justify-center item-center flex text-sm">
                Create New
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
