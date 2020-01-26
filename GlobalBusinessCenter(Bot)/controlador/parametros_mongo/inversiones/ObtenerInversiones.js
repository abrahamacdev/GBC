'use strict'

//MONGO
const inversionesModel = require('../../../modelo/Mongo/InversionesModel.js')

// UTILIDADES
const Rango = require('../../workers/rango.js')

/**
 *
 * Obtenemos las inversiones con los filtros y proyeccion pedidos
 *
 * @param {Map{}} [filtros] [Filtros con los que buscar las inversiones]
 * @param {Map{}} [projection] [Campos a obtener]
 *
 * @callback(error,docs)
 * 
 */
module.exports.conFiltros = (filtros,projection,callback) => {

	var query = inversionesModel.find(filtros)

	if (typeof projection === 'function'){

		callback = projection

	}else {

		query.select(projection)

	}	

	query.lean()
	query.exec(function(error,datos){
		
		if (error) {return callback (error,undefined)}
		
		else  {
			
			return callback (undefined,datos)
			
		}
	})
}

/**
 *
 * Obtenemos las inversiones que se encuentren dentro 
 * rango asignado
 *
 * @param {Map{}} [projection] [Campos a obtener]
 *
 * @callback(error,docs)
 * 
 */
module.exports.delRango = (projection,callback) => {

	var rango = Rango.getRango()

	var filtros = {}
	filtros['IdUsuario'] = {}
	filtros['IdUsuario']['$gt'] = rango[0] // Comienzo del rango
	filtros['IdUsuario']['$lt'] = rango[1] // Final del rango

	var query = inversionesModel.find(filtros)

	if (typeof projection === 'function'){

		callback = projection

	}else {

		query.select(projection)

	}
	
	query.lean()
	query.exec(function(error,datos){
		
		if (error) {return callback (error,undefined)}
		
		else  {

			return callback (undefined,datos)
			
		}
	})
}