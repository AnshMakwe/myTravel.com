'use strict';
const { Wallets, Gateway } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const fs = require('fs');
const path = require('path');

async function registerProviderDynamic({ enrollmentID, name, contact, rating, serviceProvider }) {
  try {
    if (!enrollmentID || !name || !contact || rating === undefined || !serviceProvider) {
      throw new Error('Enrollment ID, name, contact, rating, and service provider are required for provider registration.');
    }

    // Load the connection profile for Org1.
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


    const caURL = ccp.certificateAuthorities['ca.org1.example.com'].url;
    const ca = new FabricCAServices(caURL);

  
    const walletPath = path.join(process.cwd(), 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);


    const existingIdentity = await wallet.get(enrollmentID);
    if (existingIdentity) {
      throw new Error(`An identity for ${enrollmentID} already exists`);
    }

   
    const adminIdentity = await wallet.get('admin');
    if (!adminIdentity) {
      throw new Error('Admin identity not found. Run enrollAdmin.js first.');
    }
    const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
    const adminUser = await provider.getUserContext(adminIdentity, 'admin');

    // Register the new provider.
    const secret = await ca.register(
      {
        affiliation: 'org1.department1',
        enrollmentID: enrollmentID,
        role: 'client',
        attrs: [
          { name: 'role', value: 'provider', ecert: true },
          { name: 'name', value: name, ecert: true },
          { name: 'contact', value: contact, ecert: true },
          { name: 'rating', value: rating.toString(), ecert: true },
          { name: 'serviceProvider', value: serviceProvider, ecert: true } // Added serviceProvider
        ]
      },
      adminUser
    );

   
    const enrollment = await ca.enroll({
      enrollmentID: enrollmentID,
      enrollmentSecret: secret,
      attr_reqs: [
        { name: 'role', optional: false },
        { name: 'serviceProvider', optional: false } // Ensure serviceProvider is included in attributes
      ]
    });
    const x509Identity = {
      credentials: {
        certificate: enrollment.certificate,
        privateKey: enrollment.key.toBytes()
      },
      mspId: 'Org1MSP',
      type: 'X.509'
    };

  
    await wallet.put(enrollmentID, x509Identity);
    console.log(`Successfully enrolled identity for ${enrollmentID}`);

    
    const gw = new Gateway();
    await gw.connect(ccp, {
      wallet,
      identity: enrollmentID,
      discovery: { enabled: true, asLocalhost: true }
    });
    const network = await gw.getNetwork('mychannel');
    const contract = network.getContract('stake');

    console.log(`Submitting chaincode transaction: registerProvider with args "${name}", "${contact}", "${rating}", "${serviceProvider}"`);
    const result = await contract.submitTransaction('registerProvider', name, contact, rating.toString(), serviceProvider); // Pass serviceProvider
    console.log(`Chaincode transaction result: ${result.toString()}`);

    await gw.disconnect();

    return { enrollmentID, name, contact, rating, serviceProvider, chaincodeResult: result.toString() };
  } catch (error) {
    throw new Error(`Failed to register provider: ${error.response ? error.response.data : error.message}`);
  }
}

module.exports = registerProviderDynamic;



