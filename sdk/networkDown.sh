#!/bin/bash
#
# Copyright IBM Corp All Rights Reserved
#
# SPDX-License-Identifier: Apache-2.0
#
# Exit on first error
set -ex
aa-remove-unknown
service apparmor stop 
update-rc.d -f apparmor remove

# Bring the test network down
pushd ../test-network
docker network prune -f
docker volume prune -f
docker image prune -af

./network.sh down
popd

# clean out any old identites in the wallets
