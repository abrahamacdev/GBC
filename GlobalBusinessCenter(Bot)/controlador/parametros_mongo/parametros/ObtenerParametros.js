'use strict'

const mongoose = require('mongoose');
const parametrosModel = require('../../../modelo/Mongo/ParametrosModel.js'); 


/*
 * 
 * Obtenemos los parametros del unico registro existente
 * @callback (error,datos)
 * 
 */
module.exports = function(callback){
    
    parametrosModel.find(
        function(error,datos){
            
            if(error) {return callback(error,null)}
            return callback(null,datos)
            
        }
    )
}

/*
 * 
 * Obtenemos los parametros con los filtros dados
 * 
 * @param Map {} filtros
 * @param Map {} projection
 * 
 * @callback (error,datos)
 * 
 */
module.exports.conFiltros = function(filtros,projection,callback){	
	
	var query = parametrosModel.find(filtros)

	if (Object.keys(projection).length > 0){
		
		query.select(projection)
		
	}else {

		callback = projection

	}
	
	query.lean()

	query.exec(function(error,datos){
		
		if (error) {return callback (error,undefined)}
		
		else  {
			
			return callback (undefined,datos)
			
		}
	})
}

/*
 * 
 * Obtenemos las keys del usuario
 * @callback (keys)
 * 
 */
module.exports.obtenerKeys = function (callback){
    
    parametrosModel.find(function(error,doc){
            
        if(error) {}
        else if (doc[0] != null){
                
            var keys = {
        
            apiKey: doc[0]['apiKey'],
            secretKey: doc[0]['secretKey']
            
            }
            return callback(keys)
            
        }
    })
}