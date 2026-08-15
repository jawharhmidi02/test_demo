import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiMenu, FiX, FiMoon, FiSun, FiCheck, FiCopy, FiLogOut } from 'react-icons/fi';
import { FaWallet } from 'react-icons/fa';
import { useTheme } from '../context';
import { useWallet } from '../context';

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isWalletMenuOpen, setIsWalletMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const walletMenuRef = useRef(null);

  const { theme, toggleTheme } = useTheme();
  const {
    account,
    balance,
    networkName,
    shortAddress,
    isConnected,
    isConnecting,
    error,
    connectWallet,
    disconnectWallet,
    clearError,
  } = useWallet();

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Properties', href: '/properties' },
    { name: 'About', href: '/about' },
    { name: 'FAQ', href: '/faq' },
    { name: 'Blog', href: '/blog' },
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (walletMenuRef.current && !walletMenuRef.current.contains(event.target)) {
        setIsWalletMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleCopy = () => {
    if (account) {
      navigator.clipboard.writeText(account);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <nav className="shadow-sm bg-white dark:bg-secondary-900/80 border-b dark:border-secondary-800">
      <div className="container">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link to="/" className="flex items-center">
              <svg width="30" height="35" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="15" cy="20" r="10" stroke="#0682ff" />
                <circle cx="15" cy="20" r="6" stroke="#0682ff" strokeWidth="3" />
              </svg>
              <span className="text-2xl font-bold text-primary-600 mt-1.5">RentVerse</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className="text-secondary-600 dark:text-secondary-300 hover:text-primary-600 px-3 py-2 text-sm font-medium"
              >
                {item.name}
              </Link>
            ))}

            <button type="button" onClick={toggleTheme}>
              {theme === 'light' ? (
                <FiMoon size={24} className="text-secondary-600 hover:text-primary-600" />
              ) : (
                <FiSun size={24} className="text-amber-500 " />
              )}
            </button>

            <div className="relative" ref={walletMenuRef}>
              {isConnected ? (
                <div>
                  <button
                    type="button"
                    onClick={() => setIsWalletMenuOpen(!isWalletMenuOpen)}
                    className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-secondary-100 hover:bg-secondary-200 dark:bg-secondary-800 dark:hover:bg-secondary-700 text-secondary-800 dark:text-secondary-100 border dark:border-secondary-700 font-medium"
                  >
                    <span className="font-mono">{shortAddress}</span>
                    {balance && (
                      <span className="hidden lg:inline-block px-2 py-0.5 text-xs bg-primary-100 dark:bg-primary-950/80 text-primary-700 dark:text-primary-300 rounded-full font-semibold">
                        {balance} ETH
                      </span>
                    )}
                  </button>

                  {isWalletMenuOpen && (
                    <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white dark:bg-secondary-800 shadow-xl border dark:border-secondary-700 py-2 z-50">
                      <div className="px-4 py-2 border-b dark:border-secondary-700">
                        <p className="text-xs text-secondary-500 dark:text-secondary-400 font-medium">
                          Connected Network
                        </p>
                        <p className="text-sm text-secondary-800 dark:text-secondary-100 mt-0.5 flex items-center font-semibold">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></span>
                          {networkName || 'Ethereum'}
                        </p>
                      </div>
                      <div className="px-4 py-2 border-b dark:border-secondary-700">
                        <p className="text-xs text-secondary-500 dark:text-secondary-400 font-medium">
                          Wallet Balance
                        </p>
                        <p className="text-base font-bold text-primary-600 dark:text-primary-400 mt-0.5">
                          {balance || '0.0000'} ETH
                        </p>
                      </div>

                      <div className="p-1 space-y-0.5">
                        <button
                          type="button"
                          onClick={handleCopy}
                          className="w-full text-left px-4 py-2 text-sm text-secondary-600 dark:text-secondary-300 hover:bg-primary-50 dark:hover:bg-secondary-700 rounded-lg"
                        >
                          <span className="flex items-center justify-between">
                            {copied ? (
                              <FiCheck className="text-emerald-500 mr-2" />
                            ) : (
                              <FiCopy className=" mr-2" />
                            )}
                            {copied ? 'Copied to Clipboard!' : 'Copy Address'}
                          </span>
                          <span className="text-xs text-secondary-400 font-mono">
                            {shortAddress}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            disconnectWallet();
                            setIsWalletMenuOpen(false);
                          }}
                          className="w-full flex items-center px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg"
                        >
                          <FiLogOut className="mr-2" />
                          Disconnect
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={connectWallet}
                  disabled={isConnecting}
                  className="btn flex items-center space-x-2"
                >
                  <FaWallet className="w-4 h-4" />
                  <span>{isConnecting ? 'Connecting...' : 'Connect'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-lg text-secondary-600 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-800 focus:outline-none"
            >
              {theme === 'light' ? (
                <FiMoon size={24} />
              ) : (
                <FiSun size={24} className="text-amber-500" />
              )}
            </button>
            <button
              type="button"
              className="text-secondary-600 hover:text-primary-600"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
          </div>
        </div>

        {error && (
          <div className="py-2 px-3 my-2 text-xs bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/80 rounded-lg flex-wrap flex items-center justify-between gap-2">
            <div className="flex items-center space-x-2 flex-1 min-w-[200px]">
              <span>{error}</span>
            </div>
            <div className="flex items-center space-x-2">
              {(error.includes('MetaMask') || error.includes('No Web3 wallet')) && (
                <a
                  href="https://metamask.io/download"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3 py-1 bg-amber-500 hover:bg-amber-600  dark:hover:bg-amber-700 text-white text-xs font-semibold rounded-lg"
                >
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg"
                    alt="MetaMask Logo"
                    className="w-4 h-4 mr-1.5"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  Install MetaMask
                </a>
              )}
              <button
                onClick={clearError}
                className="font-bold text-red-500 hover:text-red-700 ml-2"
              >
                X
              </button>
            </div>
          </div>
        )}

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden">
            <div className="pt-2 pb-3 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="block px-3 py-2 text-base font-medium text-secondary-600 hover:text-primary-600 hover:bg-primary-50"
                  onClick={() => setIsOpen(false)}
                >
                  {item.name}
                </Link>
              ))}

              <div className="pt-2">
                {isConnected ? (
                  <div className="p-3 bg-secondary-100 dark:bg-secondary-800 rounded-lg space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-secondary-500 dark:text-secondary-400"> Account:</span>
                      <span className="font-mono font-semibold text-secondary-800 dark:text-secondary-100">
                        {shortAddress}
                      </span>
                    </div>
                    {balance && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-secondary-500 dark:text-secondary-400">Balance:</span>
                        <span className="font-semibold text-primary-600 dark:text-primary-400">
                          {balance} ETH
                        </span>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        disconnectWallet();
                        setIsOpen(false);
                      }}
                      className="w-full flex items-center justify-center py-2 text-sm text-red-600 dark:text-red-400 bg-white dark:bg-secondary-900 rounded-md border border-red-200 dark:border-red-800/60 font-medium"
                    >
                      <FiLogOut className="mr-2" />
                      Disconnect Wallet
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      connectWallet();
                      setIsOpen(false);
                    }}
                    disabled={isConnecting}
                    className="w-full btn flex items-center justify-center space-x-2"
                  >
                    <FaWallet className="mr-2 w-4 h-4" />
                    <span>{isConnecting ? 'Connecting...' : 'Connect Wallet'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
