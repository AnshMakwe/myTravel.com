
'use strict';
const { Gateway, Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');

async function listTravelOptionsSorted(source, destination, inputDate, sortBy, minPrice, maxPrice, filterProviderId, onlyAvailable) {
  try {
    if (!source || !destination || !sortBy) {
      throw new Error('Source, destination and sortBy parameters are required.');
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
    await gateway.connect(ccp, { wallet, identity: 'appUser', discovery: { enabled: true, asLocalhost: true } });

    const network = await gateway.getNetwork('mychannel');
    const contract = network.getContract('stake');

    console.log(`Evaluating transaction: listTravelOptionsSorted with args "${source}", "${destination}", "${sortBy}", "${minPrice}", "${maxPrice}", "${filterProviderId}", "${onlyAvailable}"`);
    const result = await contract.evaluateTransaction(
      'listTravelOptionsSorted',
      source,
      destination,
      inputDate,
      sortBy,
      minPrice || "",
      maxPrice || "",
      filterProviderId || "",
      onlyAvailable ? onlyAvailable.toString() : ""
    );
    console.log(`Transaction result: ${result.toString()}`);

    await gateway.disconnect();
    return result.toString();
  } catch (error) {
    console.error(`Failed to list sorted travel options: ${error.response ? error.response.data : error.message}`);
    throw new Error(`Chaincode error: ${error.message}`);
  }
}

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length < 3) {
    console.log('Usage: node serverListTravelOptionsSorted.js <source> <destination> <sortBy> [minPrice] [maxPrice] [filterProviderId] [onlyAvailable]');
    process.exit(1);
  }
  listTravelOptionsSorted(args[0], args[1], args[2], args[3], args[4], args[5], args[6]);
}

module.exports = listTravelOptionsSorted;




