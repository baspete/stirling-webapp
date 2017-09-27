#!/usr/bin/env bash

# First build the dist'ed app
yarn build

# Now bootstrap the deployment tools
curl https://github.build.ge.com/raw/tools/build-utils/master/bootstrap.sh | bash

# Now use the deployer to push (using an existing CF login session)
CF_ROUTES="fast-ts-web.run.aws-usw02-pr.ice.predix.io stirling.run.aws-usw02-pr.ice.predix.io"
./deploy.sh --no-login --no-prev

