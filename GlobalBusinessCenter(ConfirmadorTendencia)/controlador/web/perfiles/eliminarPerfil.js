'use strict'

const PerfilModel = require('../../../modelo/Mongo/PerfilModel.js')
const Security = require('../../../modelo/Mongo/SecurityModel.js')

/*
 * 
 * Eliminamos el usuario solicitado
 * @param String usuario
 * @callback(error,deleted)
 * 
 */
module.exports = (usuario,callback) => {
	
	var filtros = {
		
		user: usuario
		
	}
	
	PerfilModel.remove(filtros,function(err,doc){
		
		if (err){return callback(err,null)}
		
		else {
			
			Security.remove(filtros,function(error,document){
				
				if (error){return callback(error,null)}
				
				else {
				
					return callback(null,true)
					
				}
			})
		}
	})
	
}