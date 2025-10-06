# EVM Launchpad - Fourmeme Forked

Four Meme UI is a Next.js-based web application for interacting with the Four Meme platform.

<img width="1894" height="938" alt="image" src="https://github.com/user-attachments/assets/5a7ce8bb-43fc-4b6e-894b-a954f2d2c8c3" />
<img width="1629" height="908" alt="image" src="https://github.com/user-attachments/assets/49c955b8-45cb-45b0-a6ef-9bfb5383adb1" />
<img width="1596" height="732" alt="image" src="https://github.com/user-attachments/assets/fff60975-383c-4178-ab17-8e70842c1dfa" />
<img width="1631" height="844" alt="image" src="https://github.com/user-attachments/assets/7b3e9fa1-62cb-4bf4-b28f-9cc7ef7f9215" />
<img width="1604" height="831" alt="image" src="https://github.com/user-attachments/assets/d8fdc1de-8d16-46d4-a3e7-a508812ab194" />


## Getting Started

### Prerequisites

- Node.js (version 14 or later)
- Yarn package manager

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/0xopsdev/evm-launchpad-fourmeme-fork
   cd evm-launchpad-fourmeme-fork
   ```

2. Install dependencies:
   ```bash
   yarn install
   ```

### Running the Application

1. Set up your environment variables (see [Environment Variables](#environment-variables) section).

2. Start the development server:
   ```bash
   yarn dev
   ```

3. Open your browser and navigate to `http://localhost:3000`.

## Architecture Overview

Pump Fun UI is built using the following technologies and frameworks:

- Next.js: React framework for server-side rendering and static site generation
- React: JavaScript library for building user interfaces
- Tailwind CSS: Utility-first CSS framework for styling
- Ethers.js: Library for interacting with Ethereum
- RainbowKit: Ethereum wallet connection library
- Wagmi: React hooks for EVM chains
- lightweight-charts: Charting libraries for data visualization

The application follows a component-based architecture, with reusable UI components and hooks for managing state and interactions with the blockchain.

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```
NEXT_PUBLIC_API_BASE_URL=backend-url
NEXT_PUBLIC_BONDING_CURVE_MANAGER_ADDRESS="contract-address"
NEXT_PUBLIC_WS_BASE_URL=https://backend-url
CHAINSAFE_API_KEY=your_chainsafe_api_key
CHAINSAFE_BUCKET_ID=your_chainsafe_bucket_id
```

### 🚀 Looking to build a platform like four.meme?

I've made the UI open-source, but the backend and smart contract are closed-source. If you're interested in creating a full-fledged four.meme-like platform, let's collaborate! [Contact me on Telegram](https://t.me/its0xopsdev) for more details.
I can also provide the fourmeme-fork contract and backend so that you can get the entire set of platform from me.

# 👨‍💻 Author
### 📞 Telegram: [0xOpsDev](https://t.me/its0xopsdev)   
https://t.me/its0xopsdev

