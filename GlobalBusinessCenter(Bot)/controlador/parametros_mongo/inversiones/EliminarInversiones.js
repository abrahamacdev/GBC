'use strict'

// MONGO
const inversionesModel = require('../../../modelo/Mongo/InversionesModel.js')

// UTILIDADES
const Utils = require('../../../Utils.js')

/**
 *
 * Eliminamos las inversiones con los ids proporcionados
 * @param {Array[]} [ids] [Ids de la inversiones a eliiminar]
 *
 * @callback (noEliminadas,eliminadas)
 * noEliminadas-> Array[]  (Ids de las inversiones que no se han podido eliminar)
 * eliminadas-> Array[] (Ids de las inversiones que se han eliminado correctamente)
 * 
 */

module.exports.enBatch = (ids,callback) => {

	var noEliminadas = [] // Array con los ids de las inversiones no eliminadas
	var eliminadas = [] //Array con los ids de las inversiones eliminadas

	var count = 0

	var filtros = {}
	filtros['_id'] = {}
	filtros['_id']['$in'] = ids

	inversionesModel.remove(filtros,function(error,docs){

		if (error){

			console.log(error)

		}else {

			return callback(undefined,ids)

		}
	})
}