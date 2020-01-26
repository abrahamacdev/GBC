'use strict'

const penalizacionesModel = require('../../modelo/Mongo/PenalizacionesModel.js')

/*
 * 
 * Obtendremos las monedas penalizadas y las eliminaremos del
 * array de posibles inversiones
 * @param Array [] superanComprobaciones {Contiene los _id's de cada usuario valido}
 * @callback (penalizadas)
 * 
 */
module.exports = (superanComprobaciones,callback) => {
	
	var filtros = {}
	filtros['$or'] = []
	
	for (var a=0;a<superanComprobaciones.length;a++){
		
		var args = {}
		args['idUsuario'] = superanComprobaciones[a]
		filtros['$or'].push(args)
		
	}

	var query = penalizacionesModel.find(filtros).sort({idUsuario:1}).lean()
	query.exec(function(error,docs){

		if (error) {throw error}
		
		else {

			return callback(docs)
		}
	})
}