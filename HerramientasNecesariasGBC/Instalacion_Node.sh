#! /bin/bash

wget -qO- https://raw.githubusercontent.com/creationix/nvm/v0.33.6/install.sh | bash
export NVM_DIR="$HOME/.nvm" | sleep 3 | [ -s "$NVM_DIR/nvm.sh" ] | sleep 3 | . "$NVM_DIR/nvm.sh" # This loads nvm
nvm install v8.6.0
npm install pm2 -g
echo 'Se termino la instalacion'
