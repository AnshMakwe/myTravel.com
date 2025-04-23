#!/bin/bash
set -e
export MSYS_NO_PATHCONV=1

# pick language, default javascript
CC_SRC_LANGUAGE=${1:-"javascript"}
CC_SRC_LANGUAGE=$(echo "$CC_SRC_LANGUAGE" | tr '[:upper:]' '[:lower:]')

# resolve chaincode path
if [[ "$CC_SRC_LANGUAGE" =~ ^(go|golang)$ ]]; then
  CC_SRC_PATH="../chaincode/contract/go/"
elif [[ "$CC_SRC_LANGUAGE" == "javascript" ]]; then
  CC_SRC_PATH="../chaincode/contract/javascript/"
elif [[ "$CC_SRC_LANGUAGE" == "java" ]]; then
  CC_SRC_PATH="../chaincode/contract/java/"
elif [[ "$CC_SRC_LANGUAGE" == "typescript" ]]; then
  CC_SRC_PATH="../chaincode/contract/typescript/"
else
  echo "Unsupported language: $CC_SRC_LANGUAGE"
  exit 1
fi

# clear wallets only first time
rm -rf go/wallet/* javascript/wallet/* java/wallet/* typescript/wallet/*

pushd ../test-network
  # full teardown & fresh network
  ./network.sh down
  ./network.sh up createChannel -ca -c mychannel -s couchdb
  ./network.sh deployCC \
    -ccn stake \
    -ccv 1 \
    -cci initLedger \
    -ccl $CC_SRC_LANGUAGE \
    -ccp $CC_SRC_PATH
popd

echo " First-time network & chaincode v1 deployed!"

