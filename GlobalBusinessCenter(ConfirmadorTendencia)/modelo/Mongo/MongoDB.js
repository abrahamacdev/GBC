'use strict'

var mongoose = require('mongoose')

/*
 * 
 * Utilizaremos este metodo cada vez que hagamos cambios en la base de 
 * datos de mongoo
 * @callback(error)
 * 
 */
module.exports = (callback) => {
    
    // Necesario para la conexion a MongoDB
    var uri =  'mongodb://' + process.env.MongoHost + ':' + process.env.MongoPort + '/' + process.env.MongoDB
    var options = {
            
        user:process.env.MongoUser,
        pass:process.env.MongoPass       
            
    }

	console.log(uri)

    // Nos conectamos a mongoDB
    mongoose.connect(uri, options,function(error){
        if (error){return callback(error)}
		else {return callback(null)}
    });

}