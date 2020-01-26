#! /bin/bash

sudo apt-get purge mongodb-org*

sudo apt-get autoremove

sudo rm -R /var/log/mongodb/

sudo rm /var/log/mongod.log

sudo rm /etc/mongodb.conf

sudo rm -R /var/lib/mdb/

sudo rm /var/lib/_mdb_*
