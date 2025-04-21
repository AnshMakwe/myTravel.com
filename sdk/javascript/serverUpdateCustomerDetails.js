/*
 * serverUpdateCustomerDetails.js
 * Update details for an existing customer.
 * Accepts newName, newContact, isAnonymous (true/false) and identityEmail.
 */
'use strict';
const { Gateway, Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');

async function updateCustomerDetails(newName, newContact, isAnonymous, identityEmail) {
  try {
    if (!newName) {
      throw new Error('New name is required.');
    }
    if (!isAnonymous && !newContact) {
      throw new Error('New contact is required when profile is not anonymous.');
    }
    if (!identityEmail) {
      throw new Error('Identity email is required.');
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
    console.log(
      `Submitting transaction: updateCustomerDetails with args "${newName}", "${newContact}", "${isAnonymous}" using identity "${identityEmail}"`
    );
    isAnonymous = isAnonymous === true || isAnonymous === 'true'; // convert to boolean
    const result = await contract.submitTransaction('updateCustomerDetails', newName, newContact, isAnonymous);
    console.log(`Transaction result: ${result.toString()}`);
    await gateway.disconnect();
    return result.toString();
  } catch (error) {
    console.error(`Failed to update customer details: ${error.response ? error.response.data : error.message}`);
    throw new Error(`Chaincode error: ${error.message}`);
  }
}

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length < 4) {
    console.log('Usage: node serverUpdateCustomerDetails.js <newName> <newContact> <isAnonymous> <identityEmail>');
    process.exit(1);
  }
  updateCustomerDetails(args[0], args[1], args[2], args[3]);
}

module.exports = updateCustomerDetails;

