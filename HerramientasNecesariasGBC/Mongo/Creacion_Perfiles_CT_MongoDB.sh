#! /bin/bash

echo '
db.createUser(
   {
     user: "recolector",
     pwd: "cdsIBPCSO67sba",
     roles: [ {role: "readWrite", db: "gbc_tendencia"} ]
   }
);

db.grantRolesToUser("recolector",["readWrite"]);
exit;' > script_tres.js

mongo localhost:62740/gbc_tendencia ./script_tres.js

sleep 5

sudo sh ./parar_mongo.sh

sudo rm /etc/mongod.conf
sudo cp ./mongo_conf/segundo/mongod.conf /etc/mongod.conf

sudo sh ./iniciar_mongo.sh
