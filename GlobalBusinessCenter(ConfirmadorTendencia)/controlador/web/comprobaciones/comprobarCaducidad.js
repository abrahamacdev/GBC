'use strict'

const PerfilModel = require('../../../modelo/Mongo/PerfilModel.js')

/*
 * 
 * Comprobamos que aun pueda verificar2FA
 * @param String usuario
 * @callback (error,caducado,activado)
 * 
 */
module.exports = (usuario,callback) => {
	
	PerfilModel.find({user:usuario},function(error,doc){
		
		if (error) {return callback(error,null)}
		
		else {
			
			// No existe usuario
			if(doc.length == 0){
				
				return callback (null,false,false)
				
			}else {
				
				// Ya ha sido activada
				if (doc[0]['faActivated'] == true){
					
					return callback (null,null,true)
					
				}else {
					
					// Ha caducado
					if (Date.now() >= doc[0]['caducidad']){
					
						return callback (null,true)
						
					// No ha caducado
					}else {
				
						return callback (null,false)
							
					}
				}
			}
		}
	})
}