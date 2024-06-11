import VaultSlider from "@/components/VaultSlider";
import { FaPlus } from "react-icons/fa6";

export default function Home() {
  return (
    <div className="px-6 bg-gray-200">
      <VaultSlider />
      <div className="pt-10">
        <div>Your private memory vaults</div>
        <div className="h-[100px] w-[100px] shadow-lg shadow-gray-500/50 rounded-md cursor-pointer flex items-center justify-center my-3  bg-white">
          <div>
            <div className="justify-center item-center flex">
              <FaPlus />
            </div>
            <div className="justify-center item-center flex text-sm">
              Create New
            </div>
          </div>
        </div>
      </div>
      <div className="pt-8 pb-4">
        <div>Your shared memory vaults</div>
        <div className="h-[100px] w-[100px] shadow-lg shadow-gray-500/50 rounded-md cursor-pointer flex items-center justify-center my-2 bg-white">
          <div>
            <div className="justify-center item-center flex">
              <FaPlus />
            </div>
            <div className="justify-center item-center flex text-sm">
              Create New
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
}
