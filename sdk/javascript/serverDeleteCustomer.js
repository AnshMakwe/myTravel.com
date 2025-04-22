
'use strict';
const { Gateway, Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');
const FabricCAServices = require('fabric-ca-client');

async function deleteCustomer(identityEmail) {
  try {
    if (!identityEmail) {
      throw new Error('Customer identity email is required for deletion.');
    }
    // Load connection profile
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
    
    // Create wallet and get admin identity
    const walletPath = path.join(process.cwd(), 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    const adminIdentity = await wallet.get('admin');
    if (!adminIdentity) {
      throw new Error('Admin identity not found in wallet.');
    }
    
    const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
    const adminUser = await provider.getUserContext(adminIdentity, 'admin');

    // Connect as the customer to the network so chaincode can delete customer record
    const gateway = new Gateway();
    await gateway.connect(ccp, { wallet, identity: identityEmail, discovery: { enabled: true, asLocalhost: true } });
    const network = await gateway.getNetwork('mychannel');
    const contract = network.getContract('stake');
    
    console.log(`Submitting transaction: deleteCustomer`);
    const result = await contract.submitTransaction('deleteCustomer');
    console.log(`Chaincode transaction result: ${result.toString()}`);
    await gateway.disconnect();

 
    const caURL = ccp.certificateAuthorities['ca.org1.example.com'].url;
    const ca = new FabricCAServices(caURL);

    console.log(`Revoking identity for ${identityEmail}`);
    await ca.revoke({ enrollmentID: identityEmail, reason: 'cessation of operation' }, adminUser);

    const identityService = ca.newIdentityService();
    console.log(`Deleting identity for ${identityEmail} from CA`);
    await identityService.delete(identityEmail, adminUser);


    console.log(`Removing customer identity from wallet: ${identityEmail}`);
    await wallet.remove(identityEmail);
    console.log(`Customer identity removed from wallet.`);

  
    
    return result.toString();
  } catch (error) {
    console.error(`Failed to delete customer: ${error.response ? error.response.data : error.message}`);
    throw new Error(`Chaincode error: ${error.message}`);
  }
}

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.log('Usage: node serverDeleteCustomer.js <customerEmail>');
    process.exit(1);
  }
  deleteCustomer(args[0]);
}

module.exports = deleteCustomer;







