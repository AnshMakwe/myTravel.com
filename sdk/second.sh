#!/bin/bash
set -e
export MSYS_NO_PATHCONV=1


CC_SRC_LANGUAGE=${1:-"javascript"}
CC_SRC_LANGUAGE=$(echo "$CC_SRC_LANGUAGE" | tr '[:upper:]' '[:lower:]')
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

# 3) Redeploy chaincode v1 (no initLedger)
pushd ../test-network
  ./network.sh deployCC \
    -ccn stake \
    -ccv 1 \
    -ccl $CC_SRC_LANGUAGE \
    -ccp $CC_SRC_PATH
popd

echo "Chaincode v1 re-deployed (initLedger skipped)."




