import React, { useCallback, useRef, useState } from 'react';
import styles from './UploadAssets.module.css';
import { generateEncryptionKey, decryptFile } from '@/utils/upload';
// import { config } from 'dotenv';
// config({ path: './.env' });

const UploadAssets: React.FC = () => {
  const fileInput = useRef<HTMLInputElement>(null);
  const [cid, setCid] = useState('');
  const [uploading, setUploading] = useState(false);
  const [assetsUrl, setAssetsUrl] = useState('');

  const showAssets = async (ipfsHash: string) => {
    try {
      console.log('ipfsHashipfsHash', ipfsHash);

      const response = await fetch(`https://ipfs.io/ipfs/${ipfsHash}`);
      console.log('response', response);
      if (!response.ok) {
        throw new Error('Failed to fetch image from IPFS');
      }
      const encryptedData = await response.arrayBuffer();
      const encryptionKey = await generateEncryptionKey(
        process.env.NEXT_PUBLIC_ENCRYPTION_KEY!
      ); // Ensure 256-bit key
      console.log('encryptionKey', encryptionKey);
      const decryptedData = await decryptFile(
        new Uint8Array(encryptedData),
        encryptionKey
      );
      const blob = new Blob([decryptedData]); // Creating a blob from decrypted data
      const objectURL = URL.createObjectURL(blob);
      setAssetsUrl(objectURL);
    } catch (error) {
      // console.error('Error:', error); // Re-enable error logging
    }
  };

  const uploadAssets = useCallback(async () => {
    try {
      setUploading(true);
      const file = fileInput?.current?.files?.item(0) as File;
      const formData = new FormData();
      formData.append('file', file); // FormData keys are called fields
      const res = await fetch('/api/UploadIPFS', {
        method: 'POST',
        body: formData,
      });
      const resData = await res.json();
      setCid(resData.ipfsHash);
      showAssets(resData.ipfsHash);
      setUploading(false);
    } catch (e) {
      console.log(e);
      setUploading(false);
      alert('Trouble uploading file');
    }
  }, []);

  return (
    <div
      className={`${styles.profileContainer} relative bg-white rounded-lg shadow-lg p-4 mx-auto`}
    >
      <div>Pinata upload test interface</div>
      <div>
        <div className="flex items-center justify-center w-full">
          <div>
            <label
              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
              htmlFor="file_input"
            >
              Upload file
            </label>
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 dark:text-gray-400 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400"
              aria-describedby="file_input_help"
              id="file_input"
            />
            <p
              className="mt-1 text-sm text-gray-500 dark:text-gray-300"
              id="file_input_help"
            >
              SVG, PNG, JPG or GIF (MAX. 800x400px).
            </p>
          </div>
          <div>
            <button
              disabled={uploading}
              className="m-2 bg-green-600 text-white font-bold py-2 px-4 rounded"
              onClick={uploadAssets}
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </div>

        <div className="hashCid">hashCID: {cid}</div>
        {cid && (
          <img
            className="w-24 h-24"
            src={`${assetsUrl}`}
            alt="Image from IPFS"
          />
        )}
      </div>
    </div>
  );
};

export default UploadAssets;
