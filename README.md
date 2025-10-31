# TipJar - Peer-to-Peer Micro-Payment System

**Track:** Onchain Finance & Real-World Assets (RWA)  
**Subtrack:** Financial Inclusion  
**Category:** Peer-to-peer mobile payment systems

## Project Overview

TipJar is a non-custodial peer-to-peer micro-payment system built on Hedera DLT that enables seamless digital tipping and payments through Twitter integration. The platform empowers financial inclusion by allowing users to send and receive digital tokens easily, without requiring deep Web3 knowledge or traditional banking infrastructure.

**Key Features:**

- Twitter-based tipping system with bot integration
- Non-custodial wallet connections via HashConnect
- Real-time Hedera blockchain transactions
- Web application for direct peer-to-peer transfers
- OAuth2 authentication with Twitter
- Comprehensive transaction history and analytics

## Problem Statement

**The Challenge**: Over 400 million Africans lack access to digital payments due to high fees, complex banking requirements, and Web3 complexity barriers, preventing them from participating in the global digital economy.

### Detailed Problem Analysis

**Financial Exclusion in Africa**: Over 400 million adults in Africa remain unbanked, lacking access to basic financial services. Traditional banking infrastructure is expensive to build and maintain, especially in rural areas, leaving millions without the ability to participate in the digital economy.

**Barriers to Digital Payments**:

- **High Transaction Fees**: Traditional payment processors charge 2-5% fees, making micro-payments economically unviable
- **Complex Onboarding**: Lengthy KYC processes and documentation requirements exclude many users
- **Limited Infrastructure**: Poor internet connectivity and lack of banking infrastructure in remote areas
- **Cross-Border Friction**: International remittances are slow and expensive, often taking days with high fees
- **Web3 Complexity**: Existing crypto solutions require technical knowledge that most users don't possess

**Social Media Monetization Gap**: Content creators, especially in emerging markets, struggle to monetize their work directly from their audience. Existing tipping systems are either centralized (taking large cuts) or too complex for mainstream adoption.

**The Need for Inclusive Finance**: There's a critical need for a payment system that combines the accessibility of social media with the efficiency of blockchain technology, enabling anyone with a smartphone to participate in the digital economy without traditional banking barriers.

TipJar addresses these challenges by leveraging Hedera's low-cost, high-speed network to enable micro-payments through familiar social media platforms, removing technical barriers while maintaining the benefits of decentralized finance.

## Hedera Integration Summary

TipJar leverages multiple Hedera services to provide a robust, scalable, and cost-effective payment infrastructure:

### Transaction Types

**TransferTransaction**: Core payment functionality for peer-to-peer HBAR transfers

- Creates unsigned HBAR transfer transactions between sender and receiver accounts
- Supports custom transaction memos for context (e.g., "TipJar transfer")
- Handles amount conversion from USD to HBAR for user-friendly interface
- Processes both direct transfers (when receiver has wallet) and pending tips
- Uses single node configuration to avoid batch signing complexity
- Enables micro-payments with Hedera's predictable fee structure

**Transaction Flow & Edge Cases**:

1. **Direct Transfer Flow** (Receiver exists with wallet):

   - User initiates transfer via dashboard or Twitter bot
   - System validates receiver's wallet address
   - Creates unsigned TransferTransaction with sender/receiver accounts
   - Transaction sent to user's HashConnect wallet for signing
   - Signed transaction submitted to Hedera network
   - Transaction status updated in database with Hedera hash

2. **Pending Tip Flow** (Receiver doesn't exist or no wallet):

   - System creates entry in `pending_tips` table
   - Also creates `transactions` entry for sender's dashboard visibility
   - Receiver gets notified when they join platform or connect wallet
   - Pending tips automatically converted to direct transfers when wallet connected
   - Reconciliation process handles batch processing of pending tips

3. **User Registration Edge Cases**:

   - New user signs up → System checks for pending tips by Twitter handle
   - Wallet connection triggers pending tip reconciliation
   - Multiple pending tips consolidated into single notification
   - Failed reconciliation attempts logged for manual review

4. **Transaction Status Management**:
   - Pending: Transaction created but not yet submitted to Hedera
   - Confirmed: Successfully executed on Hedera network
   - Failed: Transaction rejected by network or wallet signing failed
   - Automatic retry mechanism for temporary network failures

### Economic Justification

Hedera's unique advantages directly support TipJar's mission of financial inclusion in Africa:

**Low, Predictable Fees**: Hedera's fixed fee structure (approximately $0.0001 per transaction) makes micro-payments economically viable, enabling users to tip as little as $0.01 without prohibitive transaction costs.

**High Throughput**: Hedera's 10,000+ TPS capacity ensures instant transaction processing, providing real-time payment confirmation essential for social media interactions.

**ABFT Finality**: Asynchronous Byzantine Fault Tolerance provides immediate transaction finality, eliminating the need for multiple confirmations and enabling instant payment settlement.

**Carbon-Negative Network**: Hedera's sustainable infrastructure aligns with environmental consciousness while providing reliable payment infrastructure for underbanked populations.

**Enterprise-Grade Security**: Hedera's council governance and proven security model builds trust necessary for financial applications in emerging markets.

## Architecture Diagram

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Twitter Bot   │    │  Web Frontend   │    │  Hedera Network │
│                 │    │   (Next.js)     │    │                 │
│  - Mention      │    │  - Dashboard    │    │  - Transfer     │
│    Processing   │    │  - Wallet       │    │    Transactions │
│  - Command      │    │    Connection   │    │  - Topic        │
│    Parsing      │    │  - Transaction  │    │    Messages     │
│  - Rate         │    │    History      │    │  - Account      │
│    Limiting     │    │                 │    │    Management   │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────┴───────────┐
                    │    Backend Server       │
                    │      (Express)          │
                    │                         │
                    │  - Twitter OAuth2       │
                    │  - Transaction Service  │
                    │  - Hedera Integration   │
                    │  - User Management      │
                    │  - Rate Limiting        │
                    │  - WebSocket Events     │
                    └─────────────┬───────────┘
                                  │
                    ┌─────────────┴───────────┐
                    │     Database            │
                    │    (PostgreSQL)         │
                    │                         │
                    │  - Users & Wallets      │
                    │  - Transaction History  │
                    │  - Twitter Mentions     │
                    │  - Bot Commands         │
                    │  - Rate Limit Tracking  │
                    └─────────────────────────┘

Data Flow:
1. User mentions bot on Twitter → Bot processes command → Creates unsigned transaction
2. Transaction sent to user's wallet via HashConnect → User signs → Submitted to Hedera
3. Web app users connect wallet → Create transfers → Sign with HashConnect → Execute on Hedera
4. All transactions recorded in database with Hedera transaction hashes
5. Real-time updates via WebSocket for transaction status
```

## Deployment & Setup Instructions

### Prerequisites

- Node.js 18+ and pnpm
- PostgreSQL database
- Twitter Developer Account with OAuth2 app
- Hedera Testnet account with HBAR balance

### Environment Configuration

Create `.env` files in both `server/` and `client/` directories based on the provided examples:

**Server Environment Variables** (`server/.env`):

```bash
# Server Configuration
PORT=8000
NODE_ENV=development
LOG_LEVEL=info

# Twitter API Configuration
X_API_KEY=your_twitter_api_key_here
X_API_SECRET=your_twitter_api_secret_here
X_BEARER_TOKEN=your_twitter_bearer_token_here
X_ACCESS_TOKEN=your_twitter_access_token_here
X_ACCESS_SECRET=your_twitter_access_secret_here
BOT_USERNAME=your_bot_username_here

# Twitter OAuth2 Configuration
OAUTH2_CLIENT_ID=your_oauth2_client_id_here
OAUTH2_CLIENT_SECRET=your_oauth2_client_secret_here
OAUTH2_CALLBACK_URL=http://localhost:8000/api/v1/auth/twitter/callback

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/tipjar

# Hedera Configuration
HEDERA_OPERATOR_ID=0.0.YOUR_OPERATOR_ACCOUNT_ID
HEDERA_OPERATOR_KEY=your_hedera_operator_private_key_here

# Session & Client Configuration
SESSION_SECRET=a-very-long-random-string-change-this-in-production
CLIENT_URL=http://localhost:3000

# Bot Configuration
POLL_INTERVAL=60000
START_BOT=true
CRON_SCHEDULE=* * * * *
TZ=UTC
```

**Client Environment Variables** (`client/.env.local`):

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

### Installation & Running

1. **Clone and Install Dependencies**:

```bash
git clone https://github.com/canhamzacode/tipjar-h
cd tipjar-h

# Install server dependencies
cd server
pnpm install

# Install client dependencies
cd ../client
pnpm install
```

2. **Database Setup**:

```bash
cd server
pnpm run db:push    # Push schema to database
pnpm run db:studio  # Optional: Open Drizzle Studio
```

3. **Start Development Servers**:

**Terminal 1 - Backend Server**:

```bash
cd server
pnpm run dev
```

**Terminal 2 - Frontend Client**:

```bash
cd client
pnpm run dev
```

**Terminal 3 - Twitter Bot** (Optional):

```bash
cd server
pnpm run dev:bot
```

### Running Environment

- **Frontend**: `http://localhost:3000` (Next.js React application)
- **Backend API**: `http://localhost:8000` (Express.js server)
- **Database Studio**: `http://localhost:4983` (Drizzle Studio - optional)

The application will be ready for testing on Hedera Testnet with Twitter integration enabled.

## Test Credentials & Service Setup Guide

### Twitter Developer Dashboard Setup

1. **Create Twitter Developer Account**:

   - Visit [developer.twitter.com](https://developer.twitter.com)
   - Apply for developer access with your Twitter account
   - Create a new project/app for TipJar

2. **Configure OAuth2 Application**:

   - In your Twitter app settings, enable OAuth 2.0
   - Set callback URL: `http://localhost:8000/api/v1/auth/twitter/callback`
   - Copy your Client ID and Client Secret to `.env` file
   - Enable "Request email from users" permission

3. **API Keys Configuration**:
   - Generate API Key, API Secret, Bearer Token, Access Token, and Access Token Secret
   - Add all credentials to `server/.env` file
   - Set your bot's Twitter username in `BOT_USERNAME` variable

### Database Setup (Neon PostgreSQL)

1. **Create Neon Database**:

   - Visit [neon.tech](https://neon.tech) and create a free account
   - Create a new project and database
   - Copy the connection string to `DATABASE_URL` in `server/.env`

2. **Run Database Migrations**:
   ```bash
   cd server
   pnpm run db:push    # Push schema to database
   pnpm run db:studio  # Optional: View database in browser
   ```

### Hedera Testnet Setup

1. **Create Hedera Testnet Account**:

   - Visit [portal.hedera.com](https://portal.hedera.com)
   - Create testnet account and fund with test HBAR
   - Copy Account ID and Private Key to `server/.env`:
     ```bash
     HEDERA_OPERATOR_ID=0.0.YOUR_ACCOUNT_ID
     HEDERA_OPERATOR_KEY=your_private_key_here
     ```

2. **Test Hedera Connection**:
   ```bash
   cd server
   node -e "
   require('dotenv').config();
   const { Client, AccountId, PrivateKey } = require('@hashgraph/sdk');
   const client = Client.forTestnet();
   client.setOperator(
     AccountId.fromString(process.env.HEDERA_OPERATOR_ID),
     PrivateKey.fromString(process.env.HEDERA_OPERATOR_KEY)
   );
   console.log('Hedera client configured successfully');
   "
   ```

### Judge Test Credentials

For hackathon evaluation, test credentials are provided in the submission:

- **Demo Twitter Account**: @tipjar_demo_bot
- **Demo Database**: Pre-populated with sample users and transactions
- **Test Environment**: Fully configured `.env.example` files provided
- **Hedera Testnet**: Judges will need to create their own testnet account or use provided test credentials in submission notes

**Quick Start for Judges**:

1. Copy `server/.env.example` to `server/.env`
2. Replace placeholder values with provided test credentials
3. Run `pnpm install && pnpm run dev` in both server and client directories
4. Access application at `http://localhost:3000`

## Successful Transaction Examples

**Live Testnet Transactions**:
The following are real transactions executed during TipJar development and testing:

- **Transaction 1**: `0.0.7134924@1761823802.207754851`

  - [View on HashScan](https://hashscan.io/testnet/transaction/0.0.7134924@1761823802.207754851)
  - HBAR transfer transaction demonstrating successful peer-to-peer payment

- **Transaction 2**: `0.0.7134924@1761777796.975432128`
  - [View on HashScan](https://hashscan.io/testnet/transaction/0.0.7134924@1761777796.975432128)
  - Additional successful transfer showing system reliability

**Transaction Details**:

- All transactions use Hedera Testnet for development and demonstration
- Transactions show successful HBAR transfers between accounts
- Each transaction includes custom memo: "TipJar transfer"
- Demonstrates the non-custodial flow: unsigned transaction creation → HashConnect signing → Hedera network submission

## Security & Configuration

**Security Measures**:

- Non-custodial architecture - users maintain control of private keys
- HashConnect integration for secure transaction signing
- JWT-based authentication with Twitter OAuth2
- Rate limiting on bot commands and API endpoints
- Input validation and sanitization on all endpoints
- Environment variable isolation for sensitive credentials

**Example Configuration Structure**:

```bash
# Required environment variables structure
HEDERA_OPERATOR_ID=0.0.XXXXXXX
HEDERA_OPERATOR_KEY=302e020100300506032b657004220420XXXXXXXX
TWITTER_API_CREDENTIALS=configured_via_developer_portal
DATABASE_URL=postgresql://user:pass@host:port/db
```

**Judge Access Instructions**:
Test credentials and access details are provided in the DoraHacks submission notes. The application includes a demo mode with pre-configured test accounts for evaluation purposes.

---

**Pitch Deck**: [Link to be added]
**Certification Links**: [Link to be added]
