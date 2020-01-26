'use strict'

// MODULOS EXTERNOS
const _ = require('lodash')

// MONGO
const inversionesModel = require('../../../modelo/Mongo/InversionesModel.js')

// UTILS
const Utils = require('../../../Utils.js')

/**
 *
 * Actualizamos las inversiones 
 * 
 * @param {Array[]} [inversionesActualizadas] [Actualizamos las inversiones existente]
 *
 * @callback (conError)
 * 
 */
module.exports.enBatch = (inversionesActualizadas,callback) => {

	var filtros = {}
	filtros['$or'] = []

	var aCount = 0

	for (let a=0;a<inversionesActualizadas.length;a++){

		process.nextTick(function(){

			var m = {}
			m['_id'] = inversionesActualizadas[a]['_id']
			filtros['$or'].push(m)			

			aCount++

			if (aCount == inversionesActualizadas.length){

				var query = inversionesModel.find(filtros).lean().exec(function(error,docs){

					if (error) {return callback(undefined)}

					else {

						var iCount = 0

						for (let i=0;i<docs.length;i++){

							process.nextTick(function(){

								for (var c=0;c<inversionesActualizadas.length;c++){

									if (docs[i]['_id'].toString() == inversionesActualizadas[c]['_id']){

										_.forIn(inversionesActualizadas[c],function(value,key){

											docs[i][key] = value

										})
									}
								}

								iCount++

								if (iCount == docs.length){

									var conError = [] // Monedas que no se han podido actualizar
									
									var cuenta = 0

									Utils.easyLoop(docs.length,function(i){

										inversionesModel.update({_id:docs[i]['_id']},docs[i],function(error){

											cuenta++
											if (error){conError.push(error)}

											if (cuenta == docs.length){

												return callback(conError)

											}
										})
									})
								}
							})
						}
					}
				})
			}
		})
	}
}