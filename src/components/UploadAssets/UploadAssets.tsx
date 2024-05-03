import fs from "node:fs"
import React, { useCallback, useMemo, useRef, useState } from "react";
import Image from 'next/image';
import styles from './UploadAssets.module.css';
// import { PinataUploader } from "@lukso/data-provider-pinata";
import { config } from "dotenv";
config({ path: "./.env" });

const UploadAssets: React.FC = () => {
	const fileInput = useRef<HTMLInputElement>(null);
	const [url, setUrl] = useState("");
	const [hash, setHash] = useState("");
	const [imageUrl, setImageUrl] = useState("");
	const TEST_PINATAAPIKEY = '85058c74c876be92ca22'
	const TEST_PINATASECRETAPIKEY = '5acc0dbc32cd2ffd77c2ebf1e176cf0d8fe6da98df3b3da13aed3f35421fdeb2'
	const TEST_PINATAJWTKEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiIzYTA5ZDAwZC03NzM2LTQyYjgtOWVkMy1lMzZiODNlMTdkYzAiLCJlbWFpbCI6ImF0aGVuYS5zcGFjZWJveTIxQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaW5fcG9saWN5Ijp7InJlZ2lvbnMiOlt7ImlkIjoiRlJBMSIsImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxfV0sInZlcnNpb24iOjF9LCJtZmFfZW5hYmxlZCI6ZmFsc2UsInN0YXR1cyI6IkFDVElWRSJ9LCJhdXRoZW50aWNhdGlvblR5cGUiOiJzY29wZWRLZXkiLCJzY29wZWRLZXlLZXkiOiI4NTA1OGM3NGM4NzZiZTkyY2EyMiIsInNjb3BlZEtleVNlY3JldCI6IjVhY2MwZGJjMzJjZDJmZmQ3N2MyZWJmMWUxNzZjZjBkOGZlNmRhOThkZjNiM2RhMTNhZWQzZjM1NDIxZmRlYjIiLCJpYXQiOjE3MTQ2MTg3ODl9.RVeP3-WX6_L0eFJOmGJFIxYjjcovN4EiU2DdYl-QPKc'
	// const provider = new PinataUploader({
	// 	pinataApiKey: TEST_PINATAAPIKEY,
	// 	pinataSecretApiKey: TEST_PINATASECRETAPIKEY,
	// 	pinataJWTKey: TEST_PINATAJWTKEY,
	// });

	const uploadAssets = useCallback(async () => {
		console.log("upload function")
		const file = fileInput?.current?.files?.item(0) as File;
		const formData = new FormData();
		formData.append("file", file); // FormData keys are called fields
		// const urlinfo = await provider.upload(file);
		// console.log(urlinfo);
	  }, []);
	return (
		<div
		className={`${styles.profileContainer} relative bg-white rounded-lg shadow-lg p-4 mx-auto`}
		>
			<div>Pinata IPFS upload test interface(...NOT FINISH) </div>
			<div>
				<input ref={fileInput} type="file" accept="image/*" />
				<button 
					className="m-2 bg-lukso-pink text-white font-bold py-2 px-4 rounded" 
					onClick={uploadAssets}
				>
					Upload
				</button>
				<div className="url">{url}</div>
				{/* <div>
					<img className="image" src={imageUrl} alt="uploaded image" />
				</div> */}
			</div>
		</div>
	);
};

export default UploadAssets;
