// types.ts

export interface LiquidityEvent {
    id: string;
    ethAmount: string;
    tokenAmount: string;
    timestamp: string;
  }
  
  export interface Token {
    map: any;
    id: string;
    address: string;
    creatorAddress: string;
    name: string;
    symbol: string;
    logo: string;
    description: string;
    createdAt: string;
    updatedAt: string;
    _count: {
      liquidityEvents: number;
    };
  }
  
  export interface TokenWithLiquidityEvents extends Token {
    liquidityEvents: LiquidityEvent[];
  }
  
  export interface PaginatedResponse<T> {
    [x: string]: any;//wad added
    tokens: never[];
    data: T[];
    totalCount: number;
    currentPage: number;
    totalPages: number;
  }

  // Add this new interface to your types file
export interface TokenWithTransactions extends Token {
  id: string;
  youtube: string | undefined;
  discord: string | undefined;
  twitter: any;
  website: any;
  telegram: any;
  transactions: {
    data: Transaction[];
    pagination: {
      currentPage: number;
      pageSize: number;
      totalCount: number;
      totalPages: number;
    }
  }
}

// Make sure you have a Transaction interface defined, if not, add it:
export interface Transaction {
  id: string;
  type: string;
  senderAddress: string;
  recipientAddress: string;
  ethAmount: string;
  tokenAmount: string;
  tokenPrice: string;
  txHash: string;
  timestamp: string;
  // Add any other fields that your transaction object includes
}


export interface PriceResponse {
  price: string;
}

export interface HistoricalPrice {
  tokenPrice: string;
  timestamp: string;
}

export interface USDHistoricalPrice {
  tokenPriceUSD: string;
  timestamp: string;
}

export interface TokenHolder {
  address: string;
  balance: string;
}

export interface TransactionResponse extends Omit<PaginatedResponse<Transaction>, 'data'> {
  transactions: Transaction[];
}