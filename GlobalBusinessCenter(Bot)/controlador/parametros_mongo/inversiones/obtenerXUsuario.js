'use strict'

const inversionesModel = require('../../../modelo/Mongo/InversionesModel.js')

/*
 * 
 * Obtenemos todas las inversiones de cada usuario
 * 
 * @param Array [] usuarios
 * @þaram Map{} projection
 * 
 * @callback (error,results)
 * 
 */
module.exports = (usuarios,projection,callback) => {
	
	var args = {}
	args['$or'] = []
	
	for (var a=0;a<usuarios.length;a++){
		
		var m = {}
		m['IdUsuario'] = usuarios[a]
		args['$or'].push(m)
		
	}
	
	var query = inversionesModel.find(args)
	
	if (Object.keys(projection).length > 0){
		
		query.select(projection)
		
	}
	
	query.exec(function(error,docs){
		
		if (error) {return callback (error,null)}
		
		else {
			
			return callback(null,docs)
		}
	})
}