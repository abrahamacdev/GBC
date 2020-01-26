'use strict'

// MODULOS EXTERNOS 
const moment = require('moment')
const _ = require('lodash')

// UTILIDADES
const Utils = require('../../../Utils.js')
const Config = require(Utils.dirs().CT + 'Config.js')

// MODELOS
const fiModel = require(Utils.dirs().estrategias + 'FI_EMA/' + 'FIModel.js')
const emaModel = require(Utils.dirs().estrategias + 'FI_EMA/' + 'EMAModel.js')

const margenTiempo = 1 // 1min
const tiempoNecesitado = Config.candleForStrategies * 8 // Actualmente 4h

function FI_EMA (body,res) {

	var needed = Date.now() - 
	getData(body.datos.monedas,needed,function(data){



	})


	function getData (monedas,needed,cb){

		getLastestEMAs(monedas,needed,function(EMAs){

			getLastestFIs(monedas,needed,function(FIs){

				aplicarEstrategia(EMAs,FIs)

			})
		})
	} 

	function getLastestEMAs (monedas,needed,cb) {

		var filtros = {}
		filtros['createAt'] = {} 
		filtros['createAt']['$gte'] = needed
		filtros['$or'] = []

		for(let a=0;a<monedas.length;a++){

			var m = {}
			m['moneda'] = monedas[a]
			filtros['$or'].push(m)				
		}

		console.log('FIltros ', filtros)
		console.log(moment(filtros['createAt']['$gte']))

		var query = emaModel.find(filtros).sort({createAt:1,moneda:1})
		query.exec(function(err,emas){

			if (err){return res.jsonp({status:500,result:'Ha ocurrido un error inesperado'})}
			else {

				if (emas.length == 0){return res.jsonp({status:200,result:[]})}
				else return cb (emas)
			}
		})
	}

	function getLastestFIs (monedas,needed,cb) {

		var filtros = {}
		filtros['createAt'] = {} 
		filtros['createAt']['$gte'] = needed
		filtros['$or'] = []

		for(let a=0;a<monedas.length;a++){

			var m = {}
			m['moneda'] = monedas[a]
			filtros['$or'].push(m)				
		}

		var query = fiModel.find(filtros).sort({createAt:1,moneda:1})
		query.exec(function(err,emas){

			if (err){return res.jsonp({status:500,result:'Ha ocurrido un error inesperado'})}
			else {

				if (emas.length == 0){return res.jsonp({status:200,result:[]})}
				else return cb (emas)
			}
		})
	}

	function aplicarEstrategia(emas,fis){

		var emaXMoneda = {}
		console.log('Emas ', emas)
		console.log('FIS ', fis)

		for(let a=0;a<emas.length;a++){

			process.nextTick(function(){

				if (emas[a]['moneda'] in emaXMoneda){

					emaXMoneda[emas[a]['moneda']].push(emas[a]['value'])
					
				}else {

					emaXMoneda[emas[a]['moneda']] = []
					emaXMoneda[emas[a]['moneda']].push(emas[a]['value'])

				}

				if (a == emas.length - 1){

					console.log('Ema x moneda', emaXMoneda)

					var fiXMoneda = {}

					for(let i=0;i<fis.length;i++){

						process.nextTick(function(){

							console.log(fis[i])
							if (fis[i]['moneda'] in fiXMoneda){

								fiXMoneda[fis[i]['moneda']].push(fis[i]['value'])
							}
							else {

								fiXMoneda[fis[i]['moneda']] = []
								fiXMoneda[fis[i]['moneda']].push(fis[i]['value'])
							}

							if (i == fis.length - 1){

								cruzar(fiXMoneda,emaXMoneda)
							}
						})
					}
				}
			})
		}
	}

	function cruzar (fiXMoneda,emaXMoneda) {

		console.log('FIXmoneda' , fiXMoneda)
		console.log('EMAXmoneda' , emaXMoneda)

		var positivas = []			

		_.each(fiXMoneda,function(value,key){

			if (value != undefined){

				if (value.length == emaXMoneda[key].length){

					var lastestFI = undefined 
					var lastestEMA = undefined

					var valida = false
					for(var a=0;a<value.length;a++){

						if (lastestFI == undefined){
							lastestFI = value[a]
							lastestEMA = emaXMoneda[key][a]
						}
						else {

							if (value[a] >= lastestFI){
								if (emaXMoneda[key][a] >= lastestEMA){

									lastestFI = value[a]
									lastestEMA = emaXMoneda[key][a]

									valida = true

								}else {
									valida = false
								}
							}else {
								valida = false
							}
						}
					}

					if (valida == true){
						positivas.push(key)
					}
				}
			}
		})
	}
}

module.exports = FI_EMA