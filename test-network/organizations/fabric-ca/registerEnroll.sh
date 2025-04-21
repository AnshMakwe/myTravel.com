#!/usr/bin/env bash



function createOrg1() {
  infoln "Enrolling the CA admin"
  mkdir -p organizations/peerOrganizations/org1.example.com/

  export FABRIC_CA_CLIENT_HOME=${PWD}/organizations/peerOrganizations/org1.example.com/

  set -x
  fabric-ca-client enroll -u https://admin:adminpw@localhost:7054 --caname ca-org1 --tls.certfiles "${PWD}/organizations/fabric-ca/org1/ca-cert.pem"
  { set +x; } 2>/dev/null

  echo 'NodeOUs:
  Enable: true
  ClientOUIdentifier:
    Certificate: cacerts/localhost-7054-ca-org1.pem
    OrganizationalUnitIdentifier: client
  PeerOUIdentifier:
    Certificate: cacerts/localhost-7054-ca-org1.pem
    OrganizationalUnitIdentifier: peer
  AdminOUIdentifier:
    Certificate: cacerts/localhost-7054-ca-org1.pem
    OrganizationalUnitIdentifier: admin
  OrdererOUIdentifier:
    Certificate: cacerts/localhost-7054-ca-org1.pem
    OrganizationalUnitIdentifier: orderer' > "${PWD}/organizations/peerOrganizations/org1.example.com/msp/config.yaml"

  mkdir -p "${PWD}/organizations/peerOrganizations/org1.example.com/msp/tlscacerts"
  cp "${PWD}/organizations/fabric-ca/org1/ca-cert.pem" "${PWD}/organizations/peerOrganizations/org1.example.com/msp/tlscacerts/ca.crt"

  mkdir -p "${PWD}/organizations/peerOrganizations/org1.example.com/tlsca"
  cp "${PWD}/organizations/fabric-ca/org1/ca-cert.pem" "${PWD}/organizations/peerOrganizations/org1.example.com/tlsca/tlsca.org1.example.com-cert.pem"

  mkdir -p "${PWD}/organizations/peerOrganizations/org1.example.com/ca"
  cp "${PWD}/organizations/fabric-ca/org1/ca-cert.pem" "${PWD}/organizations/peerOrganizations/org1.example.com/ca/ca.org1.example.com-cert.pem"

  # -------------------------------
  # Peer0
  # -------------------------------
  infoln "Registering peer0"
  fabric-ca-client register --caname ca-org1 --id.name peer0 --id.secret peer0pw --id.type peer --tls.certfiles "${PWD}/organizations/fabric-ca/org1/ca-cert.pem"

  infoln "Generating peer0 MSP"
  fabric-ca-client enroll -u https://peer0:peer0pw@localhost:7054 --caname ca-org1 \
    -M "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/msp" \
    --tls.certfiles "${PWD}/organizations/fabric-ca/org1/ca-cert.pem"

  cp "${PWD}/organizations/peerOrganizations/org1.example.com/msp/config.yaml" \
     "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/msp/config.yaml"

  infoln "Generating peer0 TLS certificates"
  fabric-ca-client enroll -u https://peer0:peer0pw@localhost:7054 --caname ca-org1 \
    -M "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls" \
    --enrollment.profile tls \
    --csr.hosts peer0.org1.example.com --csr.hosts localhost \
    --tls.certfiles "${PWD}/organizations/fabric-ca/org1/ca-cert.pem"

  cp "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/tlscacerts/"* \
     "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt"
  cp "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/signcerts/"* \
     "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/server.crt"
  cp "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/keystore/"* \
     "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/server.key"

  # -------------------------------
  # Peer1
  # -------------------------------
  infoln "Registering peer1"
  fabric-ca-client register --caname ca-org1 --id.name peer1 --id.secret peer1pw --id.type peer --tls.certfiles "${PWD}/organizations/fabric-ca/org1/ca-cert.pem"

  infoln "Generating peer1 MSP"
  fabric-ca-client enroll -u https://peer1:peer1pw@localhost:7054 --caname ca-org1 \
    -M "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer1.org1.example.com/msp" \
    --csr.hosts peer1.org1.example.com \
    --tls.certfiles "${PWD}/organizations/fabric-ca/org1/ca-cert.pem"

  cp "${PWD}/organizations/peerOrganizations/org1.example.com/msp/config.yaml" \
     "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer1.org1.example.com/msp/config.yaml"

  infoln "Generating peer1 TLS certificates"
  fabric-ca-client enroll -u https://peer1:peer1pw@localhost:7054 --caname ca-org1 \
    -M "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer1.org1.example.com/tls" \
    --enrollment.profile tls \
    --csr.hosts peer1.org1.example.com --csr.hosts localhost \
    --tls.certfiles "${PWD}/organizations/fabric-ca/org1/ca-cert.pem"

  cp "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer1.org1.example.com/tls/tlscacerts/"* \
     "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer1.org1.example.com/tls/ca.crt"
  cp "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer1.org1.example.com/tls/signcerts/"* \
     "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer1.org1.example.com/tls/server.crt"
  cp "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer1.org1.example.com/tls/keystore/"* \
     "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer1.org1.example.com/tls/server.key"

  # -------------------------------
  # Users
  # -------------------------------
  infoln "Registering user1 and org admin"
  fabric-ca-client register --caname ca-org1 --id.name user1 --id.secret user1pw --id.type client --tls.certfiles "${PWD}/organizations/fabric-ca/org1/ca-cert.pem"
  fabric-ca-client register --caname ca-org1 --id.name org1admin --id.secret org1adminpw --id.type admin --tls.certfiles "${PWD}/organizations/fabric-ca/org1/ca-cert.pem"

  infoln "Generating user1 MSP"
  fabric-ca-client enroll -u https://user1:user1pw@localhost:7054 --caname ca-org1 \
    -M "${PWD}/organizations/peerOrganizations/org1.example.com/users/User1@org1.example.com/msp" \
    --tls.certfiles "${PWD}/organizations/fabric-ca/org1/ca-cert.pem"

  cp "${PWD}/organizations/peerOrganizations/org1.example.com/msp/config.yaml" \
     "${PWD}/organizations/peerOrganizations/org1.example.com/users/User1@org1.example.com/msp/config.yaml"

  infoln "Generating org admin MSP"
  fabric-ca-client enroll -u https://org1admin:org1adminpw@localhost:7054 --caname ca-org1 \
    -M "${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp" \
    --tls.certfiles "${PWD}/organizations/fabric-ca/org1/ca-cert.pem"

  cp "${PWD}/organizations/peerOrganizations/org1.example.com/msp/config.yaml" \
     "${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/config.yaml"
}




function createOrderer() {
  infoln "Enrolling the CA admin"
  mkdir -p organizations/ordererOrganizations/example.com

  export FABRIC_CA_CLIENT_HOME=${PWD}/organizations/ordererOrganizations/example.com

  set -x
  fabric-ca-client enroll -u https://admin:adminpw@localhost:9054 --caname ca-orderer --tls.certfiles "${PWD}/organizations/fabric-ca/ordererOrg/ca-cert.pem"
  { set +x; } 2>/dev/null

  echo 'NodeOUs:
  Enable: true
  ClientOUIdentifier:
    Certificate: cacerts/localhost-9054-ca-orderer.pem
    OrganizationalUnitIdentifier: client
  PeerOUIdentifier:
    Certificate: cacerts/localhost-9054-ca-orderer.pem
    OrganizationalUnitIdentifier: peer
  AdminOUIdentifier:
    Certificate: cacerts/localhost-9054-ca-orderer.pem
    OrganizationalUnitIdentifier: admin
  OrdererOUIdentifier:
    Certificate: cacerts/localhost-9054-ca-orderer.pem
    OrganizationalUnitIdentifier: orderer' > "${PWD}/organizations/ordererOrganizations/example.com/msp/config.yaml"

  # Since the CA serves as both the organization CA and TLS CA, copy the org's root cert that was generated by CA startup into the org level ca and tlsca directories

  # Copy orderer org's CA cert to orderer org's /msp/tlscacerts directory (for use in the channel MSP definition)
  mkdir -p "${PWD}/organizations/ordererOrganizations/example.com/msp/tlscacerts"
  cp "${PWD}/organizations/fabric-ca/ordererOrg/ca-cert.pem" "${PWD}/organizations/ordererOrganizations/example.com/msp/tlscacerts/tlsca.example.com-cert.pem"

  # Copy orderer org's CA cert to orderer org's /tlsca directory (for use by clients)
  mkdir -p "${PWD}/organizations/ordererOrganizations/example.com/tlsca"
  cp "${PWD}/organizations/fabric-ca/ordererOrg/ca-cert.pem" "${PWD}/organizations/ordererOrganizations/example.com/tlsca/tlsca.example.com-cert.pem"

# Loop through each orderer (orderer, orderer2, orderer3, orderer4) to register and generate artifacts
  for ORDERER in orderer orderer2 orderer3 orderer4; do
    infoln "Registering ${ORDERER}"
    set -x
    fabric-ca-client register --caname ca-orderer --id.name ${ORDERER} --id.secret ${ORDERER}pw --id.type orderer --tls.certfiles "${PWD}/organizations/fabric-ca/ordererOrg/ca-cert.pem"
    { set +x; } 2>/dev/null

    infoln "Generating the ${ORDERER} MSP"
    set -x
    fabric-ca-client enroll -u https://${ORDERER}:${ORDERER}pw@localhost:9054 --caname ca-orderer -M "${PWD}/organizations/ordererOrganizations/example.com/orderers/${ORDERER}.example.com/msp" --tls.certfiles "${PWD}/organizations/fabric-ca/ordererOrg/ca-cert.pem"
    { set +x; } 2>/dev/null

    cp "${PWD}/organizations/ordererOrganizations/example.com/msp/config.yaml" "${PWD}/organizations/ordererOrganizations/example.com/orderers/${ORDERER}.example.com/msp/config.yaml"

    # Workaround: Rename the signcert file to ensure consistency with Cryptogen generated artifacts
    mv "${PWD}/organizations/ordererOrganizations/example.com/orderers/${ORDERER}.example.com/msp/signcerts/cert.pem" "${PWD}/organizations/ordererOrganizations/example.com/orderers/${ORDERER}.example.com/msp/signcerts/${ORDERER}.example.com-cert.pem"

    infoln "Generating the ${ORDERER} TLS certificates, use --csr.hosts to specify Subject Alternative Names"
    set -x
    fabric-ca-client enroll -u https://${ORDERER}:${ORDERER}pw@localhost:9054 --caname ca-orderer -M "${PWD}/organizations/ordererOrganizations/example.com/orderers/${ORDERER}.example.com/tls" --enrollment.profile tls --csr.hosts ${ORDERER}.example.com --csr.hosts localhost --tls.certfiles "${PWD}/organizations/fabric-ca/ordererOrg/ca-cert.pem"
    { set +x; } 2>/dev/null

    # Copy the tls CA cert, server cert, server keystore to well known file names in the orderer's tls directory that are referenced by orderer startup config
    cp "${PWD}/organizations/ordererOrganizations/example.com/orderers/${ORDERER}.example.com/tls/tlscacerts/"* "${PWD}/organizations/ordererOrganizations/example.com/orderers/${ORDERER}.example.com/tls/ca.crt"
    cp "${PWD}/organizations/ordererOrganizations/example.com/orderers/${ORDERER}.example.com/tls/signcerts/"* "${PWD}/organizations/ordererOrganizations/example.com/orderers/${ORDERER}.example.com/tls/server.crt"
    cp "${PWD}/organizations/ordererOrganizations/example.com/orderers/${ORDERER}.example.com/tls/keystore/"* "${PWD}/organizations/ordererOrganizations/example.com/orderers/${ORDERER}.example.com/tls/server.key"

    # Copy orderer org's CA cert to orderer's /msp/tlscacerts directory (for use in the orderer MSP definition)
    mkdir -p "${PWD}/organizations/ordererOrganizations/example.com/orderers/${ORDERER}.example.com/msp/tlscacerts"
    cp "${PWD}/organizations/ordererOrganizations/example.com/orderers/${ORDERER}.example.com/tls/tlscacerts/"* "${PWD}/organizations/ordererOrganizations/example.com/orderers/${ORDERER}.example.com/msp/tlscacerts/tlsca.example.com-cert.pem"
  done

  # Register and generate artifacts for the orderer admin
  infoln "Registering the orderer admin"
  set -x
  fabric-ca-client register --caname ca-orderer --id.name ordererAdmin --id.secret ordererAdminpw --id.type admin --tls.certfiles "${PWD}/organizations/fabric-ca/ordererOrg/ca-cert.pem"
  { set +x; } 2>/dev/null

  infoln "Generating the admin msp"
  set -x
  fabric-ca-client enroll -u https://ordererAdmin:ordererAdminpw@localhost:9054 --caname ca-orderer -M "${PWD}/organizations/ordererOrganizations/example.com/users/Admin@example.com/msp" --tls.certfiles "${PWD}/organizations/fabric-ca/ordererOrg/ca-cert.pem"
  { set +x; } 2>/dev/null

  cp "${PWD}/organizations/ordererOrganizations/example.com/msp/config.yaml" "${PWD}/organizations/ordererOrganizations/example.com/users/Admin@example.com/msp/config.yaml"
}
