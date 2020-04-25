#!/bin/bash

cd /home/ubuntu/mock-api-files

set -e

pm2 start app/index.js --name mock-api-svc || true
pm2 restart mock-api-svc
pm2 save
