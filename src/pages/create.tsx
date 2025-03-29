import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import Layout from '@/components/layout/Layout';
import SEO from '@/components/seo/SEO';
import { useCreateToken } from '@/utils/blockchainUtils';
import { updateToken } from '@/utils/api';
import { ChevronDownIcon, ChevronUpIcon, CloudArrowUpIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { parseUnits } from 'viem';
import PurchaseConfirmationPopup from '@/components/notifications/PurchaseConfirmationPopup';
import Modal from '@/components/notifications/Modal';


const MAX_FILE_SIZE = 1024 * 1024; // 1MB image size limit


const CreateToken: React.FC = () => {
  const router = useRouter();
  const [tokenName, setTokenName] = useState('');
  const [tokenSymbol, setTokenSymbol] = useState('');
  const [tokenDescription, setTokenDescription] = useState('');
  const [tokenImage, setTokenImage] = useState<File | null>(null);
  const [tokenImageUrl, setTokenImageUrl] = useState<string | null>(null);
  const [website, setWebsite] = useState('');
  const [telegram, setTelegram] = useState('');
  const [discord, setDiscord] = useState('');
  const [twitter, setTwitter] = useState('');
  const [youtube, setYoutube] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [creationStep, setCreationStep] = useState<'idle' | 'uploading' | 'creating' | 'updating' | 'completed' | 'error'>('idle');
  const [isSocialExpanded, setIsSocialExpanded] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [showPurchasePopup, setShowPurchasePopup] = useState(false);
  const [showPreventNavigationModal, setShowPreventNavigationModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { createToken, isLoading: isBlockchainLoading, UserRejectedRequestError } = useCreateToken();

  const uploadToIPFS = useCallback(async (file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      toast.error('File size exceeds 1MB limit. Please choose a smaller file.');
      return null;
    }

    setIsUploading(true);
    setCreationStep('uploading');
    const formData = new FormData();
    formData.append('file', file);

    try {
      console.log('Uploading image to IPFS...');
      const response = await axios.post('/api/upload-to-ipfs', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.url) {
        console.log('Image uploaded successfully:', response.data.url);
        setTokenImageUrl(response.data.url);
        toast.success('Image uploaded to IPFS successfully!');
        return response.data.url;
      } else {
        throw new Error('No URL returned from server');
      }
    } catch (error) {
      console.error('Error uploading to IPFS:', error);
      if (axios.isAxiosError(error) && error.response) {
        toast.error(`Failed to upload image: ${error.response.data.error || error.message}`);
      } else {
        toast.error('Failed to upload image. Please try again.');
      }
      return null;
    } finally {
      setIsUploading(false);
      setCreationStep('idle');
    }
  }, []);

  const handleFileUpload = useCallback(async (file: File) => {
    setTokenImage(file);
    const newImageUrl = await uploadToIPFS(file);
    if (newImageUrl) {
      setTokenImageUrl(newImageUrl);
    }
  }, [uploadToIPFS]);

  const handleImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  }, [handleFileUpload]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenImageUrl) {
      toast.error('Please upload an image before creating the token.');
      return;
    }
    setShowPurchasePopup(true);
  }, [tokenImageUrl]);

  const handlePurchaseConfirm = useCallback(async (purchaseAmount: bigint) => {
    setShowPurchasePopup(false);
    setCreationStep('creating');
    let tokenAddress: string | null = null;

    try {
      console.log('Creating token on blockchain...');
      tokenAddress = await createToken(tokenName, tokenSymbol, purchaseAmount);
      console.log('Token created on blockchain:', tokenAddress);

      setCreationStep('updating');

      // Add a 4-second delay before updating the server - gives the backend time to catch event and process
      await new Promise(resolve => setTimeout(resolve, 4000));

      console.log('Updating token in backend...');
      if (tokenAddress && tokenImageUrl) {
        await updateToken(tokenAddress, {
          logo: tokenImageUrl,
          description: tokenDescription,
          website,
          telegram,
          discord,
          twitter,
          youtube
        });
        console.log('Token updated in backend');
      } else {
        throw new Error('Token address or image URL is missing');
      }

      setCreationStep('completed');
      toast.success('Token created and updated successfully!');
      router.push(`/token/${tokenAddress}`);
    } catch (error) {
      console.error('Error in token creation/update process:', error);

      // Reset creation step to allow resubmission
      setCreationStep('idle');

      if (error instanceof Error) {
        if (error instanceof UserRejectedRequestError) {
          // MetaMask rejection or similar
          toast.error('Transaction was cancelled. Please try again.');
        } else if (!tokenAddress) {
          // Error occurred before token creation on blockchain
          toast.error('Failed to create token on blockchain. Please try again.');
        } else {
          // Token created on blockchain but backend update failed
          toast.error('Token created on blockchain but failed to update in backend. Please try updating later in your portfolio.');
        }
      } else {
        // Fallback error message
        toast.error('An unexpected error occurred. Please try again.');
      }
    }
  }, [tokenName, tokenSymbol, tokenImageUrl, tokenDescription, website, telegram, discord, twitter, youtube, createToken, router]);

  const getButtonText = useCallback(() => {
    switch (creationStep) {
      case 'uploading': return 'Uploading image...';
      case 'creating': return isBlockchainLoading ? 'Waiting for blockchain confirmation...' : 'Creating token on blockchain...';
      case 'updating': return 'Updating token in backend...';
      case 'completed': return 'Token created successfully!';
      case 'error': return 'Error occurred. Visit Portfolio to Update TokenInfo';
      default: return 'Create Token';
    }
  }, [creationStep, isBlockchainLoading]);

  const isButtonDisabled = creationStep !== 'idle' || !tokenName || !tokenSymbol || !tokenImageUrl;

  const toggleSocialSection = () => setIsSocialExpanded(!isSocialExpanded);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (creationStep === 'creating' || creationStep === 'updating') {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [creationStep]);
  useEffect(() => {
    if (creationStep === 'creating' || creationStep === 'updating') {
      setShowPreventNavigationModal(true);
    } else {
      setShowPreventNavigationModal(false);
    }
  }, [creationStep]);

  return (
    <Layout>
      <SEO
        title="Create Your Own Token - Bondle"
        description="Launch a coin that is instantly tradable without having to seed liquidity. - fair launch"
        image="/seo/create.jpg"
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-xl sm:text-1xl md:text-2xl font-bold text-blue-400 mb-6 text-center">Create New Token</h1>

        {/* Info button with tooltip */}
        <div className="relative mb-6 flex justify-center">
          <button
            type="button"
            className="text-gray-400 hover:text-blue-400 transition-colors duration-200 flex items-center bg-gray-800 px-3 py-2 rounded-full shadow-md"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <InformationCircleIcon className="h-5 w-5 mr-2" />
            <span className="text-[10px] sm:text-xs">Deployment Cost Info</span>
          </button>
          {showTooltip && (
            <div className="absolute left-1/2 transform -translate-x-1/2 top-12 bg-gray-800 text-white p-4 rounded-md shadow-lg z-10 w-64 border border-gray-700">
              <p className="text-[8px] sm:text-xs">
                Cost to deploy: 1 BONE
                This serves as an initial boost to the bonding curve.
              </p>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-gray-800 p-4 sm:p-6 rounded-lg shadow-xl">
          {/* Token Name and Symbol inputs */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="tokenName" className="block text-[10px] sm:text-xs font-medium text-gray-300 mb-1">
                Token Name
              </label>
              <input
                type="text"
                id="tokenName"
                value={tokenName}
                onChange={(e) => setTokenName(e.target.value)}
                required
                className="w-full py-2 px-3 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
              // placeholder="Enter token name"
              />
            </div>
            <div>
              <label htmlFor="tokenSymbol" className="block text-[10px] sm:text-xs font-medium text-gray-300 mb-1">
                Token Symbol
              </label>
              <input
                type="text"
                id="tokenSymbol"
                value={tokenSymbol}
                onChange={(e) => setTokenSymbol(e.target.value)}
                required
                className="w-full py-2 px-3 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
              // placeholder="Enter token symbol"
              />
            </div>
          </div>

          {/* Token Description textarea */}
          <div>
            <label htmlFor="tokenDescription" className="block text-[10px] sm:text-xs font-medium text-gray-300 mb-1">
              Token Description
            </label>
            <textarea
              id="tokenDescription"
              value={tokenDescription}
              onChange={(e) => setTokenDescription(e.target.value)}
              rows={4}
              className="w-full py-2 px-3 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
            // placeholder="Describe your token"
            />
          </div>

          {/* Token Image upload */}
          <div>
            <label htmlFor="tokenImage" className="block text-[10px] sm:text-xs font-medium text-gray-300 mb-2">
              Token Image
            </label>
            <div
              className="mt-1 flex justify-center items-center px-4 py-4 border-2 border-gray-600 border-dashed rounded-md hover:border-blue-500 transition duration-150 ease-in-out"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <div className="space-y-1 text-center">
                <div className="flex flex-col items-center">
                  <CloudArrowUpIcon className="mx-auto h-10 w-10 text-gray-400 mb-2" />
                  <div className="flex flex-col sm:flex-row text-[9px] sm:text-sm text-gray-400 items-center">
                    <label
                      htmlFor="tokenImage"
                      className="cursor-pointer bg-gray-700 rounded-md font-medium text-blue-400 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500 transition duration-150 ease-in-out px-3 py-2 mb-2 sm:mb-0 sm:mr-2"
                    >
                      <span>Upload a file</span>
                      <input
                        id="tokenImage"
                        name="tokenImage"
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={handleImageChange}
                        disabled={isUploading}
                        ref={fileInputRef}
                      />
                    </label>
                    <p>or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">PNG, JPG, GIF up to 1MB</p>
                </div>
              </div>
            </div>
            {isUploading && <p className="text-sm text-gray-400 mt-2">Uploading image to IPFS...</p>}
          </div>

          {/* Token Image preview */}
          {tokenImageUrl && (
            <div className="mt-4 flex justify-center">
              <div className="text-center">
                <img
                  src={tokenImageUrl}
                  alt="Token preview"
                  className="h-24 w-24 object-cover rounded-full mx-auto border-2 border-blue-500"
                />
              </div>
            </div>
          )}

          {/* Collapsible Social Media Section */}
          <div className="border border-gray-600 rounded-md overflow-hidden">
            <button
              type="button"
              onClick={toggleSocialSection}
              className="w-full flex justify-between items-center p-3 bg-gray-700 text-white hover:bg-gray-600 transition-colors duration-200"
            >
              <span className="font-medium text-[10px] sm:text-xs">Social Media Links (Optional)</span>
              {isSocialExpanded ? (
                <ChevronUpIcon className="h-5 w-5" />
              ) : (
                <ChevronDownIcon className="h-5 w-5" />
              )}
            </button>
            {isSocialExpanded && (
              <div className="p-4 bg-gray-800 grid grid-cols-1 sm:grid-cols-2 gap-4 text-[10px] sm:text-xs">
                {[
                  { id: 'website', label: 'Website', value: website, setter: setWebsite },
                  { id: 'telegram', label: 'Telegram', value: telegram, setter: setTelegram },
                  { id: 'discord', label: 'Discord', value: discord, setter: setDiscord },
                  { id: 'twitter', label: 'Twitter', value: twitter, setter: setTwitter },
                  { id: 'youtube', label: 'YouTube', value: youtube, setter: setYoutube },
                ].map((item) => (
                  <div key={item.id}>
                    <label htmlFor={item.id} className="block text-[10px] sm:text-xs font-medium text-gray-300 mb-1">
                      {item.label}
                    </label>
                    <input
                      type="url"
                      id={item.id}
                      value={item.value}
                      onChange={(e) => item.setter(e.target.value)}
                      className="w-full py-2 px-3 bg-gray-700 border border-gray-600 rounded-md text-white placeholder:text-[6px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
                      // placeholder={`Enter ${item.label.toLowerCase()} URL`}
                      placeholder={`optional`}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit button */}
          <div>
            <button
              type="submit"
              disabled={isButtonDisabled}
              className={`w-full py-3 px-4 border border-transparent rounded-full shadow-sm text-xs sm:text-sm font-medium text-white transition duration-150 ease-in-out ${isButtonDisabled
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                }`}
            >
              {getButtonText()}
            </button>
          </div>
        </form>

        {showPurchasePopup && (
          <PurchaseConfirmationPopup
            onConfirm={handlePurchaseConfirm}
            onCancel={() => setShowPurchasePopup(false)}
            tokenSymbol={tokenSymbol}
          />
        )}

        {showPreventNavigationModal && (
          <Modal
            isOpen={showPreventNavigationModal}
            onClose={() => { }} // Empty function to prevent closing
          >
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Please Wait</h3>
              <p className="text-sm text-gray-500">
                Your token is being {creationStep === 'creating' ? 'created' : 'updated'}. This
                process may take a few moments. Please do not navigate away or close the browser
                until the process is complete.
              </p>
            </div>
          </Modal>
        )}
      </div>
    </Layout>
  );
};

export default CreateToken;