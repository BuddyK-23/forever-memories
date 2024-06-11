"use client";

import React, { useState } from "react";
import { FaHeart } from "react-icons/fa6";
import { BsChatLeftTextFill, BsFillShareFill } from "react-icons/bs";

export default function Page({ params }: { params: { slug: string } }) {
  const lsp7Address = params.slug;
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="px-20 bg-gray-200 pt-10 w-full">
      <div className="flex gap-4">
        <div className="w-2/3 rounded border-8 border-white shadow-lg shadow-gray-500/50">
          <img
            className={`carousel-item w-full`}
            src={
              "https://img.freepik.com/premium-photo/portrait-european-female-college-student-campus_123211-625.jpg"
            }
            alt=""
          />
        </div>
        <div className="w-1/3">
          <div className="datePanel rounded flex bg-gray-300 p-3 mb-6 flex justify-between shadow-lg shadow-gray-500/50">
            <div className="font-bold text-xl">Memory Upload</div>
            <div>22-04-24 13:24</div>
          </div>
          <div className="p-3 rounded bg-white shadow-lg shadow-gray-500/50 rounded">
            <div className="flex gap-4">
              <div className="p-1 bg-indigo-500 rounded sm text-white justify-center flex w-[55px] h-[30px]">
                <div className="flex items-center justify-center h-full gap-1">
                  <FaHeart />
                  15
                </div>
              </div>
              <div className="p-1 bg-indigo-500 rounded sm text-white justify-center flex w-[55px] h-[30px]">
                <div className="flex items-center justify-center h-full gap-1">
                  <BsChatLeftTextFill />
                  25
                </div>
              </div>
              <div className="p-1 bg-emerald-500 rounded sm text-white font-normal">
                $FMT 245
              </div>
            </div>
            <div className="pt-6 text-xl font-normal">Section Title</div>
            <div className="pt-2 pb-6 h-[100px]">some text here</div>
            <div className="btnGroup flex justify-between">
              <div className="flex gap-2">
                <button
                  onClick={() => setShowModal(true)}
                  className="p-1 bg-blue-500 text-white text-center w-[100px] shadow-lg shadow-gray-500/50 rounded"
                >
                  Send Asset
                </button>
                <button className="border-2 border-blue-500 text-center text-blue-500 p-1 w-[100px] shadow-lg shadow-gray-500/50 rounded">
                  Auction
                </button>
              </div>

              <div className="border-gray-200 border-2 h-[40px] w-[40px] rounded-full cursor-pointer hover:bg-gray-200">
                <div className="flex items-center justify-center h-full">
                  <BsFillShareFill />
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded shadow-lg shadow-gray-500/50 rounded mt-10 p-3">
            <div className="flex justify-between">
              <div className="text-xl font-normal">Blockchain Secured</div>
              <div className="bg-pink-500 w-[50px] h-[30px] rounded text-white">
                <div className="flex items-center justify-center h-full">
                  LSP7
                </div>
              </div>
            </div>
            <div>Transaction ID, Link</div>
            <div>LSP7 token[#1 of 6]</div>
            <div>Valut name, address</div>
            <div>Owner</div>
          </div>
        </div>
      </div>

      <div className="rounded bg-white mt-10 p-3 rounded shadow-lg shadow-gray-500/50">
        <div className="text-3xl font-bold">
          Headline description "Day 1 Selfie"
        </div>
        <div className="">
          My first selfie on the blockchain, time to log my journey for
          asdflsadkjflk
        </div>
        <div className="flex gap-2 pt-5">
          <div className="p-1 bg-gray-200 rounded sm">Shared</div>
          <div className="p-1 bg-gray-200 rounded sm">Personal</div>
          <div className="p-1 bg-gray-200 rounded sm">Selfie</div>
        </div>
      </div>

      <div className="comments rounded bg-white h-[400px] mt-10 rounded shadow-lg shadow-gray-500/50 mb-6 p-3">
        <div className="text-3xl font-bold">Comments</div>
      </div>

      {showModal ? (
        <>
          <div className="justify-center items-center flex overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none">
            <div className="relative w-auto my-6 mx-auto max-w-3xl">
              {/*content*/}
              <div className="border-0 rounded-lg shadow-lg relative flex flex-col w-full bg-white outline-none focus:outline-none">
                {/*header*/}
                <div className="flex items-start justify-between p-5 border-b border-solid border-blueGray-200 rounded-t">
                  <h3 className="text-3xl font-semibold">Send Asset</h3>
                  <button
                    className="p-1 ml-auto bg-transparent border-0 text-black opacity-5 float-right text-3xl leading-none font-semibold outline-none focus:outline-none"
                    onClick={() => setShowModal(false)}
                  >
                    <span className="bg-transparent text-black opacity-5 h-6 w-6 text-2xl block outline-none focus:outline-none">
                      ×
                    </span>
                  </button>
                </div>
                {/*body*/}
                <div className="relative p-6 flex-auto">
                  <div>
                    <div className="text-xl">Address:</div>
                    <div>
                      <input
                        className="border-2 w-full p-1"
                        placeholder="0x12345..."
                        type="text"
                      />
                    </div>
                  </div>
                  <div className="pt-6 text-xl">
                    <div>Amount:</div>
                    <div>
                      <input
                        className="border-2 w-full p-1"
                        placeholder="2"
                        type="text"
                      />
                    </div>
                  </div>
                </div>
                {/*footer*/}
                <div className="flex items-center justify-end p-6 border-t border-solid border-blueGray-200 rounded-b">
                  <button
                    className="text-red-500 background-transparent font-bold uppercase px-6 py-2 text-sm outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
                    type="button"
                    onClick={() => setShowModal(false)}
                  >
                    Close
                  </button>
                  <button
                    className="bg-emerald-500 text-white active:bg-emerald-600 font-bold uppercase text-sm px-6 py-3 rounded shadow hover:shadow-lg outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
                    type="button"
                    onClick={() => setShowModal(false)}
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="opacity-25 fixed inset-0 z-40 bg-black"></div>
        </>
      ) : null}
    </div>
  );
}
