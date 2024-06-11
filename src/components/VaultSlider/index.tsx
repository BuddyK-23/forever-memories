// components/Carousel.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { FaAngleLeft, FaAngleRight, FaRegCircleCheck } from "react-icons/fa6";

const data = [
  {
    title: "Daily Selfie",
    headline: "Document Your Journey, Day by Day",
    mintCount: 35,
    url: "https://res.cloudinary.com/dsm62xkh7/image/upload/v1686314309/6-1_dlvfoq.png",
  },
  {
    title: "Dear Diary",
    headline: "Capture Today, Share Tomorrow",
    mintCount: 54,
    url: "https://res.cloudinary.com/dsm62xkh7/image/upload/v1686314249/10_2_rkdoln.png",
  },
  {
    title: "Legacy Safe",
    headline: "Secure Your Data, Pass Down Your Legacy",
    mintCount: 80,
    url: "https://res.cloudinary.com/dsm62xkh7/image/upload/v1686314268/1-1_fdc4sn.png",
  },
  {
    title: "Kids Drawings",
    headline: "Preserve Childhood Magic on the Blockchain",
    mintCount: 38,
    url: "https://res.cloudinary.com/dsm62xkh7/image/upload/v1686314309/6-1_dlvfoq.png",
  },
];

const VaultSlider = () => {
  const [currentIdx, setCurrentIdx] = useState(0);

  const changeItem = (step: number) => {
    let newIdx = (currentIdx + step) % data.length;
    if (newIdx < 0) newIdx = data.length - 1;
    setCurrentIdx(newIdx);
  };

  const handleGoToVault = () => {
    console.log("handle go to vault");
  };

  return (
    <div className="carousel-container h-[400px] relative">
      <div className="carousel mx-auto pt-20 grid grid-cols-3 relative">
        <div>
          <div className="text-6xl text-bold">Memory Vaults</div>
          <div className="pt-4 pl-1">Memory Idea</div>
        </div>

        <div className="right absolute right-10 top-2/3">
          <span
            className="right absolute top-1 right-10 cursor-pointer bg-gray-400 p-2"
            onClick={() => changeItem(-1)}
          >
            <FaAngleLeft />
          </span>
          <span
            className="right absolute top-1 right-1 cursor-pointer bg-gray-400 p-2"
            onClick={() => changeItem(1)}
          >
            <FaAngleRight />
          </span>
        </div>
      </div>

      <div className="carousel mx-auto mt-1 grid grid-cols-3 relative">
        <div className="carousel-left scale-y-[0.8] h-[200px] rounded-xl border-gray-400 border-solid flex mt-2 bg-white shadow-lg shadow-gray-500/50">
          {data.map((item, idx) => (
            <div
              key={`left-left-` + idx}
              className={`w-1/2 ${
                idx !== (currentIdx + data.length + 1) % data.length
                  ? "hidden"
                  : ""
              }`}
            >
              <img
                className={`rounded-l-xl carousel-item h-[200px]`}
                src={item.url}
                alt=""
              />
            </div>
          ))}
          {data.map((item, idx) => (
            <div
              key={`left-right-` + idx}
              className={`w-1/2 p-3 ${
                idx !== (currentIdx + data.length + 1) % data.length
                  ? "hidden"
                  : ""
              }`}
            >
              <div className="title font-bold text-xl">{item.title}</div>
              <div className="headline text-sm h-[30px]">{item.headline}</div>
              <div className="infoPanel pt-8 flex gap-1">
                <div className="bg-gray-200 h-[25px] w-[50px] rounded-md flex justify-center item-center gap-1">
                  <div className="flex items-center justify-center h-full">
                    <FaRegCircleCheck size={12} />
                  </div>
                  <div className="flex items-center justify-center h-full">
                    {item.mintCount}
                  </div>
                </div>
                <div className="bg-gray-200 h-[25px] w-[100px] rounded-md flex justify-center item-center">
                  Earn $FMT
                </div>
              </div>
              <div className="buttonGroup mt-4 flex gap-2">
                <button className="bg-sky-700 p-1 text-sm rounded text-white shadow-lg shadow-gray-500/50">
                  Deploy vault
                </button>
                <button className="border-2 border-sky-700 p-1 text-sm rounded text-sky-700 shadow-lg shadow-gray-500/50">
                  More details
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="carousel-center scale-x-[1.7] z-10 translate-y-1 h-[220px] rounded-xl border-gray-400 border-solid flex bg-white shadow-lg shadow-gray-500/50">
          {data.map((item, idx) => (
            <div
              key={`center-left-` + idx}
              className={`w-1/2 ${idx !== currentIdx ? "hidden" : ""}`}
            >
              <img
                className={`rounded-l-xl carousel-item h-[220px]`}
                src={item.url}
                alt=""
              />
            </div>
          ))}
          {data.map((item, idx) => (
            <div
              key={`center-right-` + idx}
              className={`w-1/2 p-3 ${idx !== currentIdx ? "hidden" : ""}`}
            >
              <div className="title font-bold text-2xl">{item.title}</div>
              <div className="headline text-sm h-[50px]">{item.headline}</div>
              <div className="infoPanel pt-8 flex gap-1">
                <div className="bg-gray-200 h-[25px] w-[50px] rounded-md flex justify-center item-center gap-1">
                  <div className="flex items-center justify-center h-full">
                    <FaRegCircleCheck size={12} />
                  </div>
                  <div className="flex items-center justify-center h-full">
                    {item.mintCount}
                  </div>
                </div>
                <div className="bg-gray-200 h-[25px] w-[100px] rounded-md flex justify-center item-center">
                  Earn $FMT
                </div>
              </div>
              <div className="buttonGroup mt-4 flex gap-2">
                <button className="bg-sky-700 p-1 text-sm rounded text-white shadow-lg shadow-gray-500/50">
                  Deploy vault
                </button>
                <Link href={`/vault/` + '0xsadfasdfasdfwefwef'}
                  // onClick={handleGoToVault}
                  className="border-2 border-sky-700 p-1 text-sm rounded text-sky-700 shadow-lg shadow-gray-500/50 cursor-pointer"
                >
                  More details
                </Link>
              </div>
            </div>
          ))}
        </div>
        <div className="carousel-right scale-y-[0.8] h-[200px] rounded-xl border-gray-400 border-solid mt-2 flex bg-white shadow-lg shadow-gray-500/50">
          {data.map((item, idx) => (
            <div
              key={`right-left-` + idx}
              className={`w-1/2 ${
                idx !== (currentIdx + data.length - 1) % data.length
                  ? "hidden"
                  : ""
              }`}
            >
              <img
                className={`rounded-l-xl carousel-item h-[200px]`}
                src={item.url}
                alt=""
              />
            </div>
          ))}
          {data.map((item, idx) => (
            <div
              key={`right-right-` + idx}
              className={`w-1/2 p-3 ${
                idx !== (currentIdx + data.length - 1) % data.length
                  ? "hidden"
                  : ""
              }`}
            >
              <div className="title font-bold text-xl">{item.title}</div>
              <div className="headline text-sm h-[30px]">{item.headline}</div>
              <div className="infoPanel pt-8 flex gap-1">
                <div className="bg-gray-200 h-[25px] w-[50px] rounded-md flex justify-center item-center gap-1">
                  <div className="flex items-center justify-center h-full">
                    <FaRegCircleCheck size={12} />
                  </div>
                  <div className="flex items-center justify-center h-full">
                    {item.mintCount}
                  </div>
                </div>
                <div className="bg-gray-200 h-[25px] w-[100px] rounded-md flex justify-center item-center">
                  Earn $FMT
                </div>
              </div>
              <div className="buttonGroup mt-4 flex gap-2">
                <button className="bg-sky-700 p-1 text-sm rounded text-white shadow-lg shadow-gray-500/50">
                  Deploy vault
                </button>
                <button className="border-2 border-sky-700 p-1 text-sm rounded text-sky-700 shadow-lg shadow-gray-500/50">
                  More details
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VaultSlider;
