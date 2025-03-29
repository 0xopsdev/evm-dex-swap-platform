import React, { useState } from 'react';
import Link from 'next/link';
import { ExternalLinkIcon, MessageCircleIcon, GlobeIcon, TwitterIcon, YoutubeIcon, Info } from 'lucide-react';
import { TokenWithTransactions } from '@/interface/types';
import { formatTimestamp, shortenAddress, formatAddressV2 } from '@/utils/blockchainUtils';

interface TokenInfoProps {
  tokenInfo: TokenWithTransactions;
}

const TokenInfo: React.FC<TokenInfoProps> = ({ tokenInfo }) => {
  const [showTokenInfo, setShowTokenInfo] = useState(false);

  return (
    <div className="bg-gray-800 p-2 sm:p-3 rounded-lg mb-4 shadow-lg text-[10px] sm:text-xs">
      <div 
        className="flex justify-between items-center cursor-pointer transition-colors duration-200 hover:bg-gray-700 p-1.5 rounded-md" 
        onClick={() => setShowTokenInfo(!showTokenInfo)}
      >
        <h2 className="text-xs sm:text-sm font-semibold text-blue-300">Token Information</h2>
        <Info size={16} className={`transition-transform duration-200 ${showTokenInfo ? 'transform rotate-180' : ''}`} />
      </div>
      {showTokenInfo && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-2 bg-gray-750 p-2 rounded-md">
          <div className="space-y-2">
            <InfoItem label="Symbol" value={tokenInfo?.symbol} />
            <InfoItem 
              label="Contract" 
              value={tokenInfo?.address ? formatAddressV2(tokenInfo.address) : 'Loading...'}
              link={`https://shibariumscan.io/address/${tokenInfo?.address}`}
              isExternal={true}
            />
            <InfoItem 
              label="Deployer's Wallet" 
              value={tokenInfo?.creatorAddress ? shortenAddress(tokenInfo.creatorAddress) : 'Loading...'}
              link={`/profile/${tokenInfo?.creatorAddress}`}
              isExternal={false}
            />
            <InfoItem 
              label="Created" 
              value={tokenInfo?.createdAt ? formatTimestamp(tokenInfo.createdAt) : 'Loading...'}
            />
          </div>
          <div className="space-y-2">
            <div className="flex flex-col">
              <span className="text-gray-400 font-medium mb-1">Description:</span>
              <span className="text-blue-400 break-words">{tokenInfo?.description || 'Loading...'}</span>
            </div>
            <div className="mt-2">
              <span className="text-gray-400 font-medium">Socials:</span>
              <div className="flex space-x-2 mt-1">
                <SocialLink href={tokenInfo?.telegram} icon={<MessageCircleIcon size={12} />} />
                <SocialLink href={tokenInfo?.website} icon={<GlobeIcon size={12} />} />
                <SocialLink href={tokenInfo?.twitter} icon={<TwitterIcon size={12} />} />
                <SocialLink href={tokenInfo?.discord} icon={<MessageCircleIcon size={12} />} />
                <SocialLink href={tokenInfo?.youtube} icon={<YoutubeIcon size={12} />} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const InfoItem: React.FC<{ label: string; value?: string; link?: string; isExternal?: boolean }> = ({ label, value, link, isExternal }) => (
  <div className="flex flex-col sm:flex-row sm:items-start">
    <span className="text-gray-400 font-medium sm:w-32 shrink-0">{label}:</span>
    <span className="text-blue-400 break-words sm:ml-2">
      {link ? (
        isExternal ? (
          <a href={link} target="_blank" rel="noopener noreferrer" className="hover:underline">
            {value} <ExternalLinkIcon size={10} className="inline ml-0.5" />
          </a>
        ) : (
          <Link href={link} className="hover:underline">
            {value}
          </Link>
        )
      ) : (
        value
      )}
    </span>
  </div>
);

const SocialLink: React.FC<{ href?: string; icon: React.ReactNode }> = ({ href, icon }) => (
  href ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-400 transition-colors duration-200">
      {icon}
    </a>
  ) : null
);

export default TokenInfo;
