/*
 * serverCancelTravelListing.js
 * Provider cancels a travel listing (refunds all active bookings).
 */
'use strict';
const { Gateway, Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');

async function cancelTravelListing(travelOptionId, identityEmail) {
  try {
    if (!travelOptionId) {
      throw new Error('Travel option ID is required to cancel a travel listing.');
    }
    if (!identityEmail) {
      throw new Error('Provider identity email is required.');
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

    console.log(`Submitting transaction: cancelTravelListing with travelOptionId "${travelOptionId}" using identity "${identityEmail}"`);
    const result = await contract.submitTransaction('cancelTravelListing', travelOptionId);
    console.log(`Transaction has been submitted, result: ${result.toString()}`);

    await gateway.disconnect();
    return result.toString();
  } catch (error) {
    console.error(`Failed to cancel travel listing: ${error.response ? error.response.data : error.message}`);
    throw new Error(`Chaincode error: ${error.message}`);
  }
}

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.log('Usage: node serverCancelTravelListing.js <travelOptionId> <identityEmail>');
    process.exit(1);
  }
  cancelTravelListing(args[0], args[1]);
}

module.exports = cancelTravelListing;




