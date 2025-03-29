import { GetServerSideProps } from 'next';
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import 'chartjs-adapter-date-fns';
import {
  ArrowUpDownIcon,
} from 'lucide-react';
import Layout from '@/components/layout/Layout';
import TradingViewChart from '@/components/charts/TradingViewChart';
import {
  useCurrentTokenPrice,
  useTokenLiquidity,
  useCalcBuyReturn,
  useCalcSellReturn,
  useBuyTokens,
  useSellTokens,
  useUserBalance,
  useTokenAllowance,
  useApproveTokens,
  formatAmountV2,
} from '@/utils/blockchainUtils';
import { getTokenInfoAndTransactions, getTokenUSDPriceHistory, getTokenHolders, getTokenLiquidityEvents } from '@/utils/api';
import { formatTimestamp, formatAmount } from '@/utils/blockchainUtils';
import { parseUnits, formatUnits } from 'viem';
import { useAccount, useWaitForTransactionReceipt } from 'wagmi';
import { useDebounce } from 'use-debounce';
import { toast } from 'react-toastify';
import ShareButton from '@/components/ui/ShareButton';
import SEO from '@/components/seo/SEO';
import { TokenWithTransactions } from '@/interface/types';
import Spinner from '@/components/ui/Spinner';
import { Tab } from '@headlessui/react';

import TransactionHistory from '@/components/TokenDetails/TransactionHistory';
import TokenHolders from '@/components/TokenDetails/TokenHolders';
import TokenInfo from '@/components/TokenDetails/TokenInfo';
import Chats from '@/components/TokenDetails/Chats';
// import OGPreview from '@/components/OGPreview'


const BONDING_CURVE_MANAGER_ADDRESS = process.env.NEXT_PUBLIC_BONDING_CURVE_MANAGER_ADDRESS as `0x${string}`;

interface TokenDetailProps {
  initialTokenInfo: TokenWithTransactions;
  initialPriceHistory: any[];
  initialHolders: any[];
}

// const TokenDetail: React.FC = () => {
  const TokenDetail: React.FC<TokenDetailProps> = ({ initialTokenInfo }) => {

  const router = useRouter();
  const { address } = router.query;
  const { address: userAddress } = useAccount();

  const [isApproved, setIsApproved] = useState(false);
  const [tokenInfo, setTokenInfo] = useState<TokenWithTransactions>(initialTokenInfo);

  const [transactions, setTransactions] = useState<any[]>([]);
  const [transactionPage, setTransactionPage] = useState(1);
  const [totalTransactionPages, setTotalTransactionPages] = useState(1);
  const [fromToken, setFromToken] = useState({ symbol: 'BONE', amount: '' });
  const [toToken, setToToken] = useState({ symbol: '', amount: '' });
  const [isSwapped, setIsSwapped] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [ethBalance, setEthBalance] = useState('0.000');
  const [tokenBalance, setTokenBalance] = useState('0.000');
  const [actionButtonText, setActionButtonText] = useState('Buy');
  const [chartError, setChartError] = useState<string | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [isTransacting, setIsTransacting] = useState(false);
  const [transactionHash, setTransactionHash] = useState<`0x${string}` | undefined>();

  const [selectedTab, setSelectedTab] = useState('trades');


  //holders
  const [tokenHolders, setTokenHolders] = useState<Awaited<ReturnType<typeof getTokenHolders>>>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [holdersPerPage] = useState(10);

  //confirm
  const { data: transactionReceipt, isError: transactionError, isLoading: isWaiting } = useWaitForTransactionReceipt({
    hash: transactionHash,
    confirmations: 2,
  });

  const [debouncedFromAmount] = useDebounce(fromToken.amount, 300);

  const { data: currentPrice, refetch: refetchCurrentPrice } = useCurrentTokenPrice(address as `0x${string}`);
  const { data: liquidityData, refetch: refetchLiquidity } = useTokenLiquidity(address as `0x${string}`);

  const { data: buyReturnData, isLoading: isBuyCalculating } = useCalcBuyReturn(address as `0x${string}`, parseUnits(debouncedFromAmount || '0', 18));
  const { data: sellReturnData, isLoading: isSellCalculating } = useCalcSellReturn(address as `0x${string}`, parseUnits(debouncedFromAmount || '0', 18));

  const { ethBalance: fetchedEthBalance, tokenBalance: fetchedTokenBalance, refetch: refetchUserBalance } = useUserBalance(userAddress as `0x${string}`, address as `0x${string}`);
  const { data: tokenAllowance } = useTokenAllowance(address as `0x${string}`, userAddress as `0x${string}`, BONDING_CURVE_MANAGER_ADDRESS);

  const { buyTokens } = useBuyTokens();
  const { sellTokens } = useSellTokens();
  const { approveTokens } = useApproveTokens();

  const [liquidityEvents, setLiquidityEvents] = useState<any>(null);


  const fetchTokenData = useCallback(
    async (page: number) => {
      try {
        const data = await getTokenInfoAndTransactions(address as string, page, 10);
        setTokenInfo(data);
        setTransactions(data.transactions.data);
        setTotalTransactionPages(data.transactions.pagination.totalPages);
      } catch (error) {
        console.error('Error fetching token data:', error);
      }
    },
    [address]
  );

  const fetchHistoricalPriceData = useCallback(async () => {
    try {
      const historicalData = await getTokenUSDPriceHistory(address as string);
      if (Array.isArray(historicalData) && historicalData.length > 0) {
        const formattedData = historicalData.map((item, index, arr) => {
          const prevItem = arr[index - 1] || item;
          return {
            time: new Date(item.timestamp).getTime() / 1000,
            open: parseFloat(prevItem.tokenPriceUSD),
            high: Math.max(parseFloat(prevItem.tokenPriceUSD), parseFloat(item.tokenPriceUSD)),
            low: Math.min(parseFloat(prevItem.tokenPriceUSD), parseFloat(item.tokenPriceUSD)),
            close: parseFloat(item.tokenPriceUSD),
          };
        });
        setChartData(formattedData);
      }
    } catch (error) {
      console.error('Error fetching historical price data:', error);
      setChartError('Failed to load chart data');
    }
  }, [address]);

  const fetchTokenHolders = async () => {
    if (address) {
      try {
        const holders = await getTokenHolders(address as string);
        setTokenHolders(holders);
      } catch (error) {
        console.error('Error fetching token holders:', error);
        toast.error('Failed to fetch token holders');
      }
    }
  };

  const indexOfLastHolder = currentPage * holdersPerPage;
  const indexOfFirstHolder = indexOfLastHolder - holdersPerPage;
  const currentHolders = tokenHolders.slice(indexOfFirstHolder, indexOfLastHolder);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const fetchAllData = useCallback(async () => {
    if (address) {
      await fetchTokenData(transactionPage);
      await fetchHistoricalPriceData();
      refetchCurrentPrice();
      refetchLiquidity();
      fetchTokenHolders();
      refetchUserBalance();

      
      try {
        const events = await getTokenLiquidityEvents(tokenInfo.id);
        setLiquidityEvents(events);
      } catch (error) {
        console.error('Error fetching liquidity events:', error);
      }
    }
  }, [address, transactionPage, fetchTokenData, fetchHistoricalPriceData, refetchCurrentPrice, refetchLiquidity, tokenInfo.id, refetchUserBalance]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  useEffect(() => {
    if (tokenAllowance !== undefined && address) {
      setIsApproved(tokenAllowance > 0);
    }
  }, [tokenAllowance, address]);

  useEffect(() => {
    if (fetchedEthBalance) {
      setEthBalance(parseFloat(formatUnits(fetchedEthBalance, 18)).toFixed(5));
    }
    if (fetchedTokenBalance) {
      setTokenBalance(parseFloat(formatUnits(fetchedTokenBalance, 18)).toFixed(5));
    }
  }, [fetchedEthBalance, fetchedTokenBalance]);

  useEffect(() => {
    if (transactionReceipt && !transactionError) {
      if (isSwapped) {
        if (!isApproved) {
          setIsApproved(true);
          toast.success('Token approval successful');
        } else {
          toast.success('Tokens sold successfully');
        }
      } else {
        toast.success('Tokens bought successfully');
      }
      fetchAllData();
      setIsTransacting(false);
    } else if (transactionError) {
      toast.error('Transaction failed');
      setIsTransacting(false);
    }
  }, [transactionReceipt, transactionError, isSwapped, isApproved, fetchAllData]);

  useEffect(() => {
    if (debouncedFromAmount) {
      setIsCalculating(true);
      if (isSwapped) {
        // Selling tokens
        if (sellReturnData !== undefined && !isSellCalculating) {
          const ethAmount = formatUnits(sellReturnData, 18);
          setToToken((prev) => ({ ...prev, amount: ethAmount }));
          setIsCalculating(false);
        }
      } else {
        // Buying tokens
        if (buyReturnData !== undefined && !isBuyCalculating) {
          const tokenAmount = formatUnits(buyReturnData, 18);
          setToToken((prev) => ({ ...prev, amount: tokenAmount }));
          setIsCalculating(false);
        }
      }
    } else {
      setToToken((prev) => ({ ...prev, amount: '' }));
      setIsCalculating(false);
    }
  }, [debouncedFromAmount, buyReturnData, sellReturnData, isSwapped, isBuyCalculating, isSellCalculating]);

  useEffect(() => {
    setActionButtonText(isSwapped ? (isApproved ? 'Sell' : 'Approve') : 'Buy');
  }, [isSwapped, isApproved]);

  const handleSwap = useCallback(() => {
    setIsSwapped((prev) => !prev);
    setFromToken((prev) => ({
      symbol: prev.symbol === 'BONE' ? tokenInfo.symbol : 'BONE',
      amount: '',
    }));
    setToToken((prev) => ({
      symbol: prev.symbol === 'BONE' ? tokenInfo.symbol : 'BONE',
      amount: '',
    }));
  }, [tokenInfo]);

  const handleFromAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFromToken((prev) => ({ ...prev, amount: e.target.value }));
    setIsCalculating(true);
  }, []);

  const handleAction = useCallback(async () => {
    if (!address || !fromToken.amount || !userAddress) {
      toast.error('Missing required information');
      return;
    }

    const amount = parseUnits(fromToken.amount, 18);
    setIsTransacting(true);

    try {
      let txHash;
      if (isSwapped) {
        if (!isApproved) {
          txHash = await approveTokens(address as `0x${string}`);
        } else {
          txHash = await sellTokens(address as `0x${string}`, amount);
        }
      } else {
        txHash = await buyTokens(address as `0x${string}`, amount);
      }
      console.log('Transaction hash:', txHash);
      setTransactionHash(txHash);
    } catch (error) {
      console.error('Transaction error:', error);
      toast.error('Transaction failed to initiate: ' + (error as Error).message);
      setIsTransacting(false);
    }
  }, [address, fromToken.amount, userAddress, isSwapped, isApproved, approveTokens, sellTokens, buyTokens]);

  useEffect(() => {
    if (!isWaiting && !transactionError) {
      setIsTransacting(false);
      setTransactionHash(undefined);
    }
  }, [isWaiting, transactionError]);

  const handlePageChange = useCallback((newPage: number) => {
    setTransactionPage(newPage);
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied');
  };

  if (!tokenInfo) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-screen">
          <Spinner size="large" />
        </div>
      </Layout>
    );
  }

  const calculateProgress = (currentLiquidity: bigint): number => {
    const liquidityInEth = parseFloat(formatUnits(currentLiquidity, 18));
    const target = 2500; 
    const progress = (liquidityInEth / target) * 100;
    return Math.min(progress, 100);
  };

  return (
    <Layout>
      {/* <SEO token={tokenInfo} /> */}
      <SEO
        token={{
          name: tokenInfo.name,
          symbol: tokenInfo.symbol,
          description: tokenInfo.description,
          logo: tokenInfo.logo
        }}
      />
      <div className="w-full min-h-screen bg-gray-900 text-white overflow-x-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row items-center mb-6 gap-4">
            <Image src={tokenInfo.logo} alt={tokenInfo.name} width={64} height={64} className="rounded-full" />
            <div className="text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold text-blue-400">{tokenInfo.name}</h1>
              <p className="text-sm text-gray-300">{tokenInfo.symbol}</p>
            </div>
          </div>

      {/* Price and Liquidity Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-800 p-4 rounded-lg">
          <h2 className="text-xs sm:text-sm font-semibold mb-2 text-blue-300">Current Price</h2>
          <p className="text-[10px] sm:text-xs text-blue-400">
            {currentPrice ? formatAmount(currentPrice.toString()) : 'Loading...'} BONE
          </p>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <h2 className="text-xs sm:text-sm font-semibold mb-2 text-blue-300">Current Liquidity</h2>
          <p className="text-[10px] sm:text-xs text-blue-400 mb-2">
            {liquidityData && liquidityData[2] ? `${formatAmountV2(liquidityData[2].toString())} BONE` : '0 BONE'}
          </p>
          {liquidityData && liquidityData[2] && (
            <>
              <div className="w-full bg-gray-700 rounded-full h-4 mb-2 relative">
                <div 
                  className="bg-blue-600 h-full rounded-l-full transition-all duration-500 ease-out"
                  style={{ width: `${calculateProgress(liquidityData[2])}%` }}
                ></div>
                <div 
                  className="absolute top-0 left-0 w-full h-full flex items-center justify-center text-xs font-semibold text-white"
                >
                  {calculateProgress(liquidityData[2]).toFixed(2)}%
                </div>
              </div>
              
            </>
          )}
        </div>
      </div>

          {/* Token Information Section */}
          <TokenInfo tokenInfo={tokenInfo} />

          {/* Price Chart Section */}
          <div className="mb-8">
            <h2 className="text-sm sm:text-base font-semibold mb-4 text-blue-300">Price Chart (USD)</h2>
            <div className="bg-gray-800 p-2 sm:p-4 rounded-lg shadow">
            <TradingViewChart 
                data={chartData} 
                liquidityEvents={liquidityEvents} 
                tokenInfo={tokenInfo}
              />
            </div>
          </div>

          {/* Quick Actions Section */}
          <div className="bg-gray-800 p-4 sm:p-6 rounded-lg mb-8">
            <h2 className="text-sm sm:text-base font-semibold mb-4 text-blue-300">Quick Actions</h2>
            <div className="bg-gray-700 p-4 rounded-lg">
              <div className="mb-4 relative">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2">
                  <label className="text-xs sm:text-sm text-gray-300 mb-1 sm:mb-0">From</label>
                  <span className="text-[10px] sm:text-sm text-gray-400">
                    Balance: {isSwapped ? tokenBalance : ethBalance} {fromToken.symbol}
                  </span>
                </div>
                <div className="flex items-center bg-gray-600 rounded p-2">
                  <input
                    type="number"
                    value={fromToken.amount}
                    onChange={handleFromAmountChange}
                    className="w-full bg-transparent text-white outline-none text-xs sm:text-sm"
                    placeholder="0.00"
                    disabled={isTransacting}
                  />
                  <span className="ml-2 text-[10px] sm:text-sm text-gray-300 whitespace-nowrap">{fromToken.symbol}</span>
                </div>
              </div>
              <button onClick={handleSwap} className="w-full flex justify-center py-2 text-gray-400 hover:text-blue-400 mb-4">
                <ArrowUpDownIcon size={20} />
              </button>
              <div className="mb-4 relative">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2">
                  <label className="text-xs sm:text-sm text-gray-300 mb-1 sm:mb-0">To (Estimated)</label>
                  <span className="text-[10px] sm:text-sm text-gray-400">
                    Balance: {isSwapped ? ethBalance : tokenBalance} {toToken.symbol}
                  </span>
                </div>
                <div className="flex items-center bg-gray-600 rounded p-2">
                  <input
                    type="text"
                    value={isCalculating ? 'Calculating...' : toToken.amount ? parseFloat(toToken.amount).toFixed(5) : ''}
                    readOnly
                    className="w-full bg-transparent text-white outline-none text-[10px] sm:text-sm"
                    placeholder="0.00"
                  />
                  <span className="ml-2 text-xs sm:text-sm text-gray-300 whitespace-nowrap">{toToken.symbol}</span>
                </div>
              </div>
              <button
                onClick={handleAction}
                className="w-full bg-blue-500 text-white py-3 rounded hover:bg-blue-600 transition-colors disabled:opacity-50 text-sm sm:text-base"
                disabled={!fromToken.amount || isCalculating || isTransacting}
              >
                {isTransacting ? 'Processing...' : actionButtonText} {isSwapped ? '' : tokenInfo.symbol}
              </button>
            </div>
          </div>

          {/* Trades and Chats Section */}
          <div className="mb-8">
            <Tab.Group>
              <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/20 p-1">
                <Tab
                  className={({ selected }) =>
                    `w-full rounded-lg py-2.5 text-sm font-medium leading-5 text-blue-700
                    ${
                      selected
                        ? 'bg-white shadow'
                        : 'text-blue-100 hover:bg-white/[0.12] hover:text-white'
                    }`
                  }
                >
                  Trades
                </Tab>
                <Tab
                  className={({ selected }) =>
                    `w-full rounded-lg py-2.5 text-sm font-medium leading-5 text-blue-700
                    ${
                      selected
                        ? 'bg-white shadow'
                        : 'text-blue-100 hover:bg-white/[0.12] hover:text-white'
                    }`
                  }
                >
                  Chats
                </Tab>
              </Tab.List>
              <Tab.Panels className="mt-2">
                <Tab.Panel>
                  <TransactionHistory
                    transactions={transactions}
                    transactionPage={transactionPage}
                    totalTransactionPages={totalTransactionPages}
                    tokenSymbol={tokenInfo.symbol}
                    handlePageChange={handlePageChange}
                  />
                </Tab.Panel>
                <Tab.Panel>
                  <Chats tokenAddress={address as string} tokenInfo={tokenInfo} />
                </Tab.Panel>
              </Tab.Panels>
            </Tab.Group>
          </div>

          {/* Token Holders Section */}
          <TokenHolders
            tokenHolders={currentHolders}
            currentPage={currentPage}
            totalPages={Math.ceil(tokenHolders.length / holdersPerPage)}
            tokenSymbol={tokenInfo.symbol}
            creatorAddress={tokenInfo.creatorAddress}
            onPageChange={paginate}
          />

          {/* Share Button */}
          <ShareButton tokenInfo={tokenInfo} />

        </div>
      </div>
      {/* {process.env.NODE_ENV === 'development' && <OGPreview />} */}
    </Layout>
  );
};

//simple server-side rendering  just to get token info for seo - nothing more - nothing else  
export const getServerSideProps: GetServerSideProps = async (context) => {
  const { address } = context.params as { address: string };

  try {
    const tokenInfo = await getTokenInfoAndTransactions(address, 1, 1);

    return {
      props: {
        initialTokenInfo: tokenInfo,
      },
    };
  } catch (error) {
    console.error('Error fetching token data:', error);
    return {
      notFound: true,
    };
  }
};

export default TokenDetail;