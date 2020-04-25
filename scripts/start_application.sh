#!/bin/bash

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion

nvm use 10

cd /home/ubuntu/mock-api-files

set -e

pm2 start app/index.js --name mock-api-svc || true
pm2 restart mock-api-svc
pm2 save
