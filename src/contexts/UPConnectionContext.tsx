import { ethers, BrowserProvider } from 'ethers';
import { SiweMessage } from 'siwe';
import React, { createContext, useState, useEffect, ReactNode } from 'react';

// Define types for context
interface UPConnectionContextProps {
  provider: BrowserProvider | null;
  account: string | null;
  isLoggedIn: boolean;
  connectUP: () => Promise<void>;
  loginUP: () => Promise<void>;
  disconnectUP: () => void;
}

const defaultContext: UPConnectionContextProps = {
  provider: null,
  account: null,
  isLoggedIn: false,
  connectUP: async () => {},
  loginUP: async () => {},
  disconnectUP: () => {},
};

export const UPConnectionContext = createContext<UPConnectionContextProps>(defaultContext);

interface UPConnectionProviderProps {
  children: ReactNode;
}

export const UPConnectionProvider: React.FC<UPConnectionProviderProps> = ({ children }) => {
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const connectUP = async () => {
    if (window.lukso) {
      const upProvider = new ethers.BrowserProvider(window.lukso);
      try {
        const accounts = await upProvider.send('eth_requestAccounts', []);
        console.log('Connected with', accounts[0]);

        // Manually pass the provider and account to loginUP
        await loginUP(upProvider, accounts[0]);

        // Save state in local storage
        localStorage.setItem('connectedAccount', accounts[0]);
        localStorage.setItem('isLoggedIn', 'true');
        
        // Set the state after successful connection and login
        setProvider(upProvider);
        setAccount(accounts[0]);
        setIsLoggedIn(true);
      } catch (error) {
        console.error('Failed to connect:', error);
        setIsLoggedIn(false); // Reset if something fails
      }
    } else {
      console.warn('UP Browser Extension not found');
    }
  };

  const loginUP = async (upProvider?: BrowserProvider, userAccount?: string) => {
    const currentProvider = upProvider || provider;
    const currentAccount = userAccount || account;
    
    if (!currentProvider || !currentAccount) {
      console.warn('Please connect to a Universal Profile first.');
      return;
    }

    const { chainId } = await currentProvider.getNetwork();
    const siweMessage = new SiweMessage({
      domain: window.location.host,
      address: currentAccount,
      statement: 'By logging in you agree to the terms and conditions.',
      uri: window.location.origin,
      version: '1',
      chainId: Number(chainId),
      resources: ['https://terms.website.com'],
    }).prepareMessage();

    try {
      const signer = await currentProvider.getSigner(currentAccount);
      const signature = await signer.signMessage(siweMessage);
      console.log('Signature:', signature);

      // Verify the signature on-chain
      const universalProfileContract = new ethers.Contract(
        currentAccount,
        require('@lukso/lsp-smart-contracts/artifacts/UniversalProfile.json').abi,
        currentProvider
      );

      const hashedMessage = ethers.hashMessage(siweMessage);
      const isValidSignature = await universalProfileContract.isValidSignature(hashedMessage, signature);

      if (isValidSignature === '0x1626ba7e') {
        console.log('Log In successful!');
      } else {
        console.error('Log In failed. Invalid signature.');
      }
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const disconnectUP = () => {
    console.log("Disconnecting...");
    setProvider(null);
    setAccount(null);
    setIsLoggedIn(false);

    // Clear local storage
    localStorage.removeItem("connectedAccount");
    localStorage.removeItem("isLoggedIn");

    // Reload the page
    window.location.reload();
  };

  useEffect(() => {
    const initializeConnection = async () => {
      setIsLoading(true);
      const savedAccount = localStorage.getItem('connectedAccount');
      const savedIsLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

      if (savedAccount && savedIsLoggedIn && window.lukso) {
        const upProvider = new ethers.BrowserProvider(window.lukso);
        setProvider(upProvider);
        setAccount(savedAccount);
        setIsLoggedIn(true);
        console.log('Restored connection with', savedAccount);
      }
      setIsLoading(false);
    };

    initializeConnection();
  }, []);

  return (
    <UPConnectionContext.Provider value={{ provider, account, isLoggedIn, connectUP, disconnectUP, loginUP }}>
      {children}
    </UPConnectionContext.Provider>
  );
};
