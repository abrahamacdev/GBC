#! /bin/bash

sudo apt-get purge aerospike-server-community
sudo apt-get purge aerospike-tools
sudo rm -R /opt/aerospike/
sudo rm /opt/aerospike/data/bar.dat
