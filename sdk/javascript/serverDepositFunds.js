
'use strict';
const { Gateway, Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');

async function depositFunds(amount, identityEmail) {
  try {
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      throw new Error('A valid positive deposit amount is required.');
    }
    if (!identityEmail) {
      throw new Error('Identity email is required for deposit funds.');
    }
    const ccpPath = path.resolve(
      __dirname,
      '..',
      '..',
      'test-network',
      'organizations',
      'peerOrganizations',
      'org1.example.com',
      'connection-org1.json'
    );
    const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

    const walletPath = path.join(process.cwd(), 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    const gateway = new Gateway();
    await gateway.connect(ccp, { wallet, identity: identityEmail, discovery: { enabled: true, asLocalhost: true } });

    const network = await gateway.getNetwork('mychannel');
    const contract = network.getContract('stake');

    console.log(`Submitting transaction: depositFunds with amount "${amount}" using identity "${identityEmail}"`);
    const result = await contract.submitTransaction('depositFunds', amount);
    console.log(`Transaction has been submitted, result: ${result.toString()}`);

    await gateway.disconnect();
    return result.toString();
  } catch (error) {
    console.error(`Failed to deposit funds: ${error.response ? error.response.data : error.message}`);
    throw new Error(`Chaincode error: ${error.message}`);
  }
}

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.log('Usage: node serverDepositFunds.js <amount> <identityEmail>');
    process.exit(1);
  }
  depositFunds(args[0], args[1]);
}

module.exports = depositFunds;




