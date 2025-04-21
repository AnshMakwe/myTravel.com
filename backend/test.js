// listWalletIdentities.js
const { Wallets } = require('fabric-network');
const path = require('path');

(async () => {
  try {
    const walletPath = path.join(process.cwd(), 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    const identities = await wallet.list();
    console.log('Wallet identities:', identities);
  } catch (error) {
    console.error('Error listing identities:', error);
  }
})();



