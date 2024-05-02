import React from 'react';
import Image from 'next/image';

import identicon from 'ethereum-blockies-base64';

import { useProfile } from '@/contexts/ProfileContext';
import { useEthereum } from '@/contexts/EthereumContext';
import styles from './UploadAssets.module.css';

/**
 * Displays the user's profile information including images,
 * name, account address, description, and tags. The component
 * uses the useProfile and useEthereum hooks to fetch profile
 * and account data, respectively.
 */
const UploadAssets: React.FC = () => {
  const { profile } = useProfile();
  const { account } = useEthereum();
  const identiconUrl = account ? identicon(account) : '';

  return (
    <div
      className={`relative bg-white rounded-lg shadow-lg p-4 mx-auto`}
    >
      <div className="flex justify-center relative">
         Upload the assets
      </div>
    </div>
  );
};

export default UploadAssets;
