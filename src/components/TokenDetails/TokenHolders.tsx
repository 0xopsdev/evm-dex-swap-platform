import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon, ExternalLinkIcon } from 'lucide-react';
import { TokenHolder } from '@/interface/types';
import { formatAmountV3, shortenAddress } from '@/utils/blockchainUtils';

interface TokenHoldersProps {
  tokenHolders: TokenHolder[];
  currentPage: number;
  totalPages: number;
  tokenSymbol: string;
  creatorAddress: string;
  onPageChange: (page: number) => void;
}

const TokenHolders: React.FC<TokenHoldersProps> = ({
  tokenHolders,
  currentPage,
  totalPages,
  tokenSymbol,
  creatorAddress,
  onPageChange,
}) => {
  return (
    <div className="mb-8">
      <h2 className="text-sm sm:text-base font-semibold mb-4 text-blue-300">Token Holders</h2>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-gray-700">
              <th className="p-2 text-left text-gray-300">Address</th>
              <th className="p-2 text-left text-gray-300">Amount</th>
            </tr>
          </thead>
          <tbody>
            {/* Bonding Curve Manager as the first entry */}
            <tr className="border-b border-gray-700">
              <td className="p-2">
                <div className="text-blue-400">Bonding Curve</div>
              </td>
              <td className="p-2 text-blue-400">Alpha</td>
            </tr>
            {tokenHolders.map((holder, index) => (
              <tr key={index} className="border-b border-gray-700">
                <td className="p-2">
                  {holder.address === creatorAddress ? (
                    <a
                      href={`https://www.shibariumscan.io/address/${holder.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline"
                    >
                      Creator <ExternalLinkIcon size={14} className="inline ml-1" />
                    </a>
                  ) : (
                    <a
                      href={`https://www.shibariumscan.io/address/${holder.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline"
                    >
                      {shortenAddress(holder.address)} <ExternalLinkIcon size={14} className="inline ml-1" />
                    </a>
                  )}
                </td>
                <td className="p-2 text-blue-400">{formatAmountV3(holder.balance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {tokenHolders.length === 0 && <p className="text-gray-400 text-center mt-4">No token holder data available</p>}

      {/* Updated Pagination for token holders */}
      {tokenHolders.length > 0 && (
        <div className="flex items-center justify-center mt-4 space-x-2">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-1 rounded-md bg-gray-800 text-gray-400 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            <ChevronLeftIcon size={16} />
          </button>
          <div className="flex items-center space-x-1">
            {[...Array(totalPages)].map((_, index) => {
              const page = index + 1;
              if (
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 1 && page <= currentPage + 1)
              ) {
                return (
                  <button
                    key={page}
                    onClick={() => onPageChange(page)}
                    className={`px-2 py-1 text-xs rounded-md transition-colors duration-200 ${
                      currentPage === page
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    {page}
                  </button>
                );
              } else if (
                page === currentPage - 2 ||
                page === currentPage + 2
              ) {
                return (
                  <span key={page} className="text-gray-500 text-xs">
                    ...
                  </span>
                );
              }
              return null;
            })}
          </div>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-1 rounded-md bg-gray-800 text-gray-400 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            <ChevronRightIcon size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default TokenHolders;