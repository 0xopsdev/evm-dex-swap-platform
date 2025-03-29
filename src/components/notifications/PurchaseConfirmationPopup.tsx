import React, { useState } from 'react';
import { X as XIcon } from 'lucide-react';
import { parseUnits } from 'viem';

interface PurchaseConfirmationPopupProps {
  onConfirm: (amount: bigint) => void;
  onCancel: () => void;
  tokenSymbol: string;
}

const PurchaseConfirmationPopup: React.FC<PurchaseConfirmationPopupProps> = ({ onConfirm, onCancel, tokenSymbol }) => {
  const [purchaseAmount, setPurchaseAmount] = useState('');

  const handleConfirm = () => {
    const amount = parseFloat(purchaseAmount);
    onConfirm(amount ? parseUnits(purchaseAmount, 18) : BigInt(0));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-gray-800 p-4 sm:p-6 rounded-lg shadow-xl w-full max-w-xs sm:max-w-sm relative">
        <button
          onClick={onCancel}
          className="absolute top-2 right-2 text-gray-400 hover:text-white"
          aria-label="Close"
        >
          <XIcon size={18} />
        </button>
        <h2 className="text-sm font-bold text-blue-400 mb-2">How many {tokenSymbol} do you want to buy?</h2>
        <p className="text-[10px] sm:text-xs text-gray-400 mb-3 italic leading-tight">
          Tip: It&apos;s optional, but buying a small amount helps protect your coin from snipers
        </p>
        <input
          type="number"
          value={purchaseAmount}
          onChange={(e) => setPurchaseAmount(e.target.value)}
          className="w-full py-2 px-3 bg-gray-700 border border-gray-600 rounded-md text-white mb-3 text-[8px]"
          placeholder={`0.0 (optional)`}
        />
        <div className="flex justify-end space-x-3 mb-3">
          <button onClick={onCancel} className="px-3 py-1.5 bg-gray-600 text-white rounded-md text-xs sm:text-sm">Cancel</button>
          <button onClick={handleConfirm} className="px-3 py-1.5 bg-blue-500 text-white rounded-md text-xs sm:text-sm">Confirm</button>
        </div>
        <p className="text-[8px] sm:text-xs text-gray-400 text-center">
          Cost to deploy: ~1 BONE
        </p>
      </div>
    </div>
  );
};

export default PurchaseConfirmationPopup;