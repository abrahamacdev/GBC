#! /bin/bash

echo 'db.createUser(
   {
     user: "admin",
     pwd: "bc7865KZXMOabn",
     roles: [ {role: "userAdminAnyDatabase", db: "admin"} ]
   }
);
exit;' > ./script.js

mongo localhost:62740/admin ./script.js

echo '
db.createUser(
   {
     user: "gbc_owner",
     pwd: "bk765HGCalcn",
     roles: [ {role: "dbOwner", db: "gbc"} ]
   }
);

db.createUser(
   {
     user: "user_def",
     pwd: "jshbUIYGS7868",
     roles: [ {role: "readWrite", db: "gbc"} ]
   }
);

db.grantRolesToUser("user_def",["readWrite"]);' > script_dos.js

mongo localhost:62740/gbc ./script_dos.js

sleep 5

sudo sh ./parar_mongo.sh

sudo rm /etc/mongod.conf
sudo cp ./mongo_conf/segundo/mongod.conf /etc/mongod.conf

sudo sh ./iniciar_mongo.sh


