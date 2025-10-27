// import {
//   HederaSessionEvent,
//   HederaJsonRpcMethod,
//   DAppConnector,
//   HederaChainId,
// } from '@hashgraph/hedera-wallet-connect';
// import { LedgerId } from '@hashgraph/sdk';

// const metadata = {
//   name: 'Hedera Integration using Hedera DAppConnector - v1 approach',
//   description: 'Hedera dAppConnector Example',
//   url: 'https://example.com',
//   icons: ['https://avatars.githubusercontent.com/u/31002956'],
// };

// const dAppConnector = new DAppConnector(
//   metadata,
//   LedgerId.TESTNET,
//   projectId,
//   Object.values(HederaJsonRpcMethod),
//   [HederaSessionEvent.ChainChanged, HederaSessionEvent.AccountsChanged],
//   [HederaChainId.Mainnet, HederaChainId.Testnet]
// );

// await dAppConnector.init({ logger: 'error' });
