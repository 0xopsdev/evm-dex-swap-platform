import React, { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, ChevronDownIcon, ExternalLinkIcon } from 'lucide-react';
import { formatTimestamp, formatAmountV3, shortenAddress } from '@/utils/blockchainUtils';
import { Transaction } from '@/interface/types';

interface TransactionHistoryProps {
  transactions: Transaction[];
  transactionPage: number;
  totalTransactionPages: number;
  tokenSymbol: string;
  handlePageChange: (newPage: number) => void;
}

const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  transactions,
  transactionPage,
  totalTransactionPages,
  tokenSymbol,
  handlePageChange,
}) => {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const toggleRow = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  return (
    <div className="mb-8">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead className="hidden sm:table-header-group">
            <tr className="bg-gray-700">
              <th className="p-2 text-left text-gray-300">Maker</th>
              <th className="p-2 text-left text-gray-300">Type</th>
              <th className="p-2 text-left text-gray-300">BONE</th>
              <th className="p-2 text-left text-gray-300">{tokenSymbol}</th>
              <th className="p-2 text-left text-gray-300">Date</th>
              <th className="p-2 text-left text-gray-300">Tx</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <React.Fragment key={tx.id}>
                <tr 
                  className="border-b border-gray-700 cursor-pointer sm:cursor-default"
                  onClick={() => toggleRow(tx.id)}
                >
                  <td className="p-2 text-blue-400 hidden sm:table-cell">{shortenAddress(tx.senderAddress)}</td>
                  <td className="p-2 text-blue-400">{tx.type}</td>
                  <td className="p-2 text-blue-400">{formatAmountV3(tx.ethAmount)}</td>
                  <td className="p-2 text-blue-400">{formatAmountV3(tx.tokenAmount)}</td>
                  <td className="p-2 text-blue-400 hidden sm:table-cell">{formatTimestamp(tx.timestamp)}</td>
                  <td className="p-2 text-blue-400 hidden sm:table-cell">
                    <a href={`https://shibariumscan.io/tx/${tx.txHash}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      {tx.txHash.slice(-8)}
                    </a>
                  </td>
                  <td className="p-2 text-blue-400 sm:hidden">
                    <ChevronDownIcon size={16} className={`transition-transform ${expandedRow === tx.id ? 'rotate-180' : ''}`} />
                  </td>
                </tr>
                {expandedRow === tx.id && (
                  <tr className="sm:hidden bg-gray-800">
                    <td colSpan={4}>
                      <div className="p-2 space-y-2">
                        <p>Maker: {shortenAddress(tx.senderAddress)}</p>
                        <p>Date: {formatTimestamp(tx.timestamp)}</p>
                        <a 
                          href={`https://shibariumscan.io/tx/${tx.txHash}`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="flex items-center text-blue-400 hover:underline"
                        >
                          View Tx <ExternalLinkIcon size={16} className="ml-1" />
                        </a>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
      {transactions.length === 0 && <p className="text-gray-400 text-center mt-4">No transaction history available</p>}

      {/* Updated Pagination for transactions */}
      {transactions.length > 0 && (
        <div className="flex items-center justify-center mt-4 space-x-2">
          <button
            onClick={() => handlePageChange(transactionPage - 1)}
            disabled={transactionPage === 1}
            className="p-1 rounded-md bg-gray-800 text-gray-400 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            <ChevronLeftIcon size={16} />
          </button>
          <div className="flex items-center space-x-1">
            {[...Array(totalTransactionPages)].map((_, index) => {
              const page = index + 1;
              if (
                page === 1 ||
                page === totalTransactionPages ||
                (page >= transactionPage - 1 && page <= transactionPage + 1)
              ) {
                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-2 py-1 text-xs rounded-md transition-colors duration-200 ${
                      transactionPage === page
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    {page}
                  </button>
                );
              } else if (
                page === transactionPage - 2 ||
                page === transactionPage + 2
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
            onClick={() => handlePageChange(transactionPage + 1)}
            disabled={transactionPage === totalTransactionPages}
            className="p-1 rounded-md bg-gray-800 text-gray-400 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            <ChevronRightIcon size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default TransactionHistory;