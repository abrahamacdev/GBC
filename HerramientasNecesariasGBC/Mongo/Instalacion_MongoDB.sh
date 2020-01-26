#! /bin/bash

sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv EA312927
echo "deb http://repo.mongodb.org/apt/ubuntu xenial/mongodb-org/3.2 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-3.2.list
sudo apt-get -f install
sudo apt-get update
sudo apt-get install -y mongodb-org

# Borramos el antiguo .conf y ponemos el nuevo
sudo rm /etc/mongod.conf
sudo cp ./mongo_conf/primero/mongod.conf /etc/mongod.conf

# Directorio por defecto para guardado de los datos
sudo rm -R /var/lib/mongodb 

#Para el guardado de datos
sudo mkdir /var/lib/mdb 
sudo mkdir /var/lib/mdb/data

# Copiamos el servicio para poder lanzarlo con el sh
sudo cp ./mongodb.service /etc/systemd/system/

systemctl daemon-reload

# Nos otorgamos los permisos
sudo chmod -R 777 /var/lib/mdb/data/

#Iniciamos Mongo
sudo sh ./iniciar_mongo.sh 











