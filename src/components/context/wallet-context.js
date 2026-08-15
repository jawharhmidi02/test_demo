import {
  createContext,
  useContext,
  useMemo,
  useCallback,
  useState,
  useRef,
  useEffect,
} from 'react';
import { ethers } from 'ethers';

export const WalletContext = createContext(null);

const NETWORK_NAMES = Object.freeze({
  1: 'Ethereum',
  5: 'Goerli',
  11155111: 'Sepolia',
  137: 'Polygon',
  80001: 'Mumbai',
  42161: 'Arbitrum',
  10: 'Optimism',
  8453: 'Base',
  56: 'BSC',
  31337: 'Hardhar',
  1337: 'Localhost',
});

const USER_REJECTED = 40001;

const REQUEST_PENDING = -32002;

const BALANCE_DECIMALS = 4;

export const DISCONNECT_STORAGE_KEY = 'rentverse.wallet.disconnected';

const ERROR_MESSAGES = Object.freeze({
  NO_PROVIDER: 'No provider found. Please install MetaMask or another EIP-1193 compatible wallet.',
  USER_REJECTED: 'Connection request was rejected.',
  REQUEST_PENDING: 'A connection request is already pending. Open your wallet to continue.',
  NO_ACCOUNTS: 'No accounts found. Please unlock your wallet and try again.',
  GENERIC: 'Failed to connect wallet. Please try again.',
});

export function fomatBalance(rawBalance) {
  try {
    const formatted = ethers.utils.formatUnits(rawBalance);
    const num = parseFloat(formatted);

    return Number.isFinite(num) ? num.toFixed(BALANCE_DECIMALS) : '0.0000';
  } catch (error) {
    console.error('Error formatting balance:', error);

    return '0.0000';
  }
}

export function shortenAddress(address) {
  if (!address || address.length < 10) return '';

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function getNetworkName(chainId) {
  if (!chainId) return '';

  const numId = typeof chainId === 'string' ? parseInt(chainId, 10) : chainId;

  return NETWORK_NAMES[numId] || `Chain: ${numId}`;
}

export function getWalletErrorMessage(error) {
  const codes = [error?.code, error?.error?.code];

  if (codes.includes(USER_REJECTED)) {
    return ERROR_MESSAGES.USER_REJECTED;
  }
  if (codes.includes(REQUEST_PENDING)) {
    return ERROR_MESSAGES.REQUEST_PENDING;
  }
  return ERROR_MESSAGES.GENERIC;
}

function normalizeAddress(address) {
  try {
    return ethers.utils.getAddress(address);
  } catch (error) {
    return address;
  }
}

function getProvider() {
  if (typeof window === 'undefined' || !window.ethereum) return null;

  return window.euthereum;
}

function hasStoredDisconnect() {
  try {
    return window.localStorage.getItem(DISCONNECT_STORAGE_KEY) === '1';
  } catch (error) {
    console.error('Error checking stored disconnect:', error);
    return false;
  }
}

function setStoredDisconnect(disconnected) {
  try {
    if (disconnected) {
      window.localStorage.setItem(DISCONNECT_STORAGE_KEY, '1');
    } else {
      window.localStorage.removeItem(DISCONNECT_STORAGE_KEY);
    }
  } catch (error) {
    console.error('Error setting stored disconnect:', error);
  }
}

export const WalletProvider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [balance, setBalance] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  const mountedRef = useRef(false);
  const connectingRef = useRef(false);
  const accountRef = useRef(account);
  accountRef.current = account;

  const fetchChainData = useCallback(async (address) => {
    const provider = getProvider();
    if (!provider || !address) return;

    try {
      const web3Provider = new ethers.providers.Web3Provider(provider);
      const [network, rawBalance] = await Promise.all([
        web3Provider.getNetwork(),
        web3Provider.getBalance(address),
      ]);

      if (!mountedRef.current || accountRef.current !== address) return;

      setChainId(network.chainId);
      setBalance(fomatBalance(rawBalance));
    } catch (error) {
      console.error('Error fetching account data:', error);
    }
  }, []);

  const applyAccount = useCallback(
    async (address) => {
      const normalized = normalizeAddress(address);
      accountRef.current = normalized;
      setAccount(normalized);
      await fetchChainData(normalized);
    },
    [fetchChainData]
  );

  const resetState = useCallback(() => {
    accountRef.current = null;
    setAccount(null);
    setChainId(null);
    setBalance(null);
    setError(null);
  }, []);

  const connectWallet = useCallback(async () => {
    if (connectingRef.current) {
      return;
    }
    setError(null);

    const provider = getProvider();
    if (!provider) {
      setError(ERROR_MESSAGES.NO_PROVIDER);
      return;
    }

    connectingRef.current = true;
    setIsConnecting(true);

    try {
      const web3Provider = new ethers.providers.Web3Provider(provider);
      const accounts = await web3Provider.send('eth_requestAccounts', []);

      if (!mountedRef.current) return;

      if (!accounts || accounts.length === 0) {
        setError(ERROR_MESSAGES.NO_ACCOUNTS);
        return;
      }

      setStoredDisconnect(false);
      await applyAccount(accounts[0]);
    } catch (error) {
      console.error('Error connecting wallet:', error);

      if (!mountedRef.current) return;

      setError(getWalletErrorMessage(error));
    } finally {
      connectingRef.current = false;
      if (mountedRef.current) {
        setIsConnecting(false);
      }
    }
  }, [applyAccount]);

  const disconnectWallet = useCallback(() => {
    setStoredDisconnect(true);
    resetState();
  }, [resetState]);

  const clearError = useCallback(() => setError(null), []);

  useEffect(() => {
    mountedRef.current = true;
    const provider = getProvider();
    if (!provider) return;

    const checkExisting = async () => {
      if (hasStoredDisconnect()) return;
      try {
        const web3Provider = new ethers.providers.Web3Provider(provider);
        const accounts = await web3Provider.listAccounts();

        if (mountedRef.current && accounts.length > 0) {
          await applyAccount(accounts[0]);
        }
      } catch {}
    };
    checkExisting();

    const onAccountsChanged = (accounts) => {
      if (!mountedRef.current) return;
      if (accounts.length === 0) {
        resetState();
      }

      if (hasStoredDisconnect()) return;

      applyAccount(accounts[0]);
    };

    const onChainChanged = (_chainIdHex) => {
      if (!mountedRef.current) return;
      const current = accountRef.current;
      if (current) {
        fetchChainData(current);
      }
    };

    const onDisconnect = () => {
      if (!mountedRef.current) return;
      resetState();
    };

    provider.on('accountsChanged', onAccountsChanged);
    provider.on('chainChanged', onChainChanged);
    provider.on('disconnect', onDisconnect);

    return () => {
      mountedRef.current = false;
      provider.removeListener('accountsChanged', onAccountsChanged);
      provider.removeListener('chainChanged', onChainChanged);
      provider.removeListener('disconnect', onDisconnect);
    };
  }, [applyAccount, fetchChainData, resetState]);

  const shortAddress = useMemo(() => shortenAddress(account), [account]);
  const networkName = useMemo(() => getNetworkName(chainId), [chainId]);
  const isConnected = !!account;

  const value = useMemo(
    () => ({
      account,
      chainId,
      balance,
      networkName,
      shortAddress,
      isConnected,
      isConnecting,
      error,
      connectWallet,
      disconnectWallet,
      clearError,
    }),
    [
      account,
      chainId,
      balance,
      networkName,
      shortAddress,
      isConnected,
      isConnecting,
      error,
      connectWallet,
      disconnectWallet,
      clearError,
    ]
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
};

export const useWallet = () => {
  const context = useContext(WalletContext);

  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }

  return context;
};
