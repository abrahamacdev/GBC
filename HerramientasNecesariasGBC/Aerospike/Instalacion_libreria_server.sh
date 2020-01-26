#! /bin/sh

#Instalacion del servidor

wget -O aerospike.tgz http://www.aerospike.com/download/server/3.14.1.4/artifact/ubuntu16
tar -xvf aerospike.tgz
cd aerospike-server-community-*-ubuntu16.04

sudo sh ./asinstall

cd ../
sudo rm ./aerospike.tgz && sudo rm ./aerospike-server-community-3.14.1.3-ubuntu16.04
sudo rm /etc/aerospike/aerospike.conf

sudo apt-get update
sleep 3

sudo cp ./aerospike.conf /etc/aerospike/


