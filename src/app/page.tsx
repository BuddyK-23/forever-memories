"use client";

import React, { useState, useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import Image from "next/image";
import nft1 from "@/assets/image/1.jpg";
import nft2 from "@/assets/image/2.jpg";
import nft3 from "@/assets/image/3.jpg";
import nft4 from "@/assets/image/4.jpg";
import nft5 from "@/assets/image/5.jpg";
import nft6 from "@/assets/image/6.jpg";
import nft7 from "@/assets/image/7.jpg";

// Import Swiper styles
import "swiper/css";
import "swiper/css/pagination";

import "./index.css";

// import required modules
import { Pagination } from "swiper/modules";

export default function Home() {
  return (
    <main className="flex min-h-[768px] flex-col items-center justify-between h-[768px] bg-black">
      <Swiper
        pagination={{
          dynamicBullets: true,
        }}
        modules={[Pagination]}
        className="dashboardSwiper"
      >
        <SwiperSlide>
          <Image src={nft1} alt="NFT image" />
        </SwiperSlide>
        <SwiperSlide>
          <Image src={nft2} alt="NFT image" />
        </SwiperSlide>
        <SwiperSlide>
          <Image src={nft3} alt="NFT image" />
        </SwiperSlide>
        <SwiperSlide>
          <Image src={nft4} alt="NFT image" />
        </SwiperSlide>
        <SwiperSlide>
          <Image src={nft5} alt="NFT image" />
        </SwiperSlide>
        <SwiperSlide>
          <Image src={nft6} alt="NFT image" />
        </SwiperSlide>
        <SwiperSlide>
          <Image src={nft7} alt="NFT image" />
        </SwiperSlide>
      </Swiper>
    </main>
  );
}
