'use strict'

// MODULOS EXTERNOS
const _  = require('lodash')
const moment = require('moment')
const fi = require('technicalindicators').ForceIndex
const ema = require('technicalindicators').EMA
const asyncLoop = require('node-async-loop')

// UTILIDADES
const Utils = require('../../../../Utils.js')
const Config = require(Utils.dirs().CT + 'Config.js')

// MODULOS EXTERNOS
const velasModel = require(Utils.dirs().modeloMongo + 'VelasModel.js')
const preciosModel  = require(Utils.dirs().modeloMongo + 'PreciosModel.js')
const fiModel = require('./FIModel.js')
const emaModel = require('./EMAModel.js')

var calculando = false

const FI_TTL = 60 * 60 //* 6 // 6H
const EMA_TTL = 60 * 60 //* 6// 6H
const PERIODOS_FI = 1
const PERIODOS_EMA = 2

var FI_EMA = function() {

	_.bindAll(this)
}

FI_EMA.prototype.calcular = function() {

	if (calculando == true){}
	else {

		prepararVelas(function(datosXMoneda){

			FI(datosXMoneda,function(newFIs){

				getFIs(function(oldFIs){

					EMA(newFIs,oldFIs,function(emaResults){

						if (Object.keys(emaResults).length > 0){

							guardar(emaModel,emaResults,EMA_TTL)
						}

						if (Object.keys(newFIs).length > 0){

							guardar(fiModel,newFIs,FI_TTL)
						}
					})		
				})
			})
		})
	}
}

function prepararVelas (cb){

	obtenerUltimasVelas(function(velas){

		if (velas.length == 0){}
		else {

			var data = {}

			for(let i=0;i<velas.length;i++){

				process.nextTick(function(){

					if (velas[i]['moneda'] in data === false){

						data[velas[i]['moneda']] = {}
						data[velas[i]['moneda']]['fields'] = {}
						data[velas[i]['moneda']]['fields']['volume'] = []
						data[velas[i]['moneda']]['fields']['close'] = []

						data[velas[i]['moneda']]['fields']['volume'].push(velas[i]['V'])
						data[velas[i]['moneda']]['fields']['close'].push(velas[i]['C'])
					}
					else {

						data[velas[i]['moneda']]['fields']['volume'].push(velas[i]['V'])
						data[velas[i]['moneda']]['fields']['close'].push(velas[i]['C'])
					}

					if (i == velas.length - 1){

						return cb(data)

					}
				})
			}
		}
	})
}

function obtenerUltimasVelas(cb) {

	var sToMs = 1000 // Milisegundos en 1 segundo  
	var minus = sToMs * ((Config.candleForStrategies * velasNecesitadas()) + Config.candleForStrategies / 2)// 17min 30s // 1h 45min
	var utc = moment().unix() - minus

	var filtros = {}
	filtros['fecha'] = {}
	filtros['fecha']['$gte'] = utc

	var query = velasModel.find(filtros)
	query.sort({nombre: 1,fecha: -1})
	query.exec(function(error,docs){

		if (error){throw error}

		else {return cb(docs)}
	})
}

function FI(datosXMoneda,cb){

	var results = {}
	var f = parseFloat

	_.each(datosXMoneda,function(v,k){

		var m = {}
		m['close'] = []
		m['volume'] = []
		m['period'] = PERIODOS_FI

		for (let i=0;i<v.fields.volume.length;i++){

			m.volume.push(v.fields.volume[i])
		}

		for (let i=0;i<v.fields.close.length;i++){

			m.close.push(v.fields.close[i])
		}

		var c = f(fi.calculate(m)).toFixed(8)

		if (c == 'NaN'){
			c = 0
		}

		results[k] = c

	})

	console.log('FIs', results)
	return cb(results)
}

function getFIs(cb){

	var fiNeeded = Date.now() - ((PERIODOS_EMA * Config.candleForStrategies) + (Config.candleForStrategies / 2))

	var filtros = {}
	filtros['createAt'] = {}
	filtros['createAt']['$gte'] = fiNeeded

	var query = fiModel.find(filtros).sort({'moneda':1,'createAt':-1})
	query.exec(function(error,docs){

		if (error){throw error}
		else {

			var m = {}

			for (let a=0;a<docs.length;a++){

				if (!m[docs[a]['moneda']] in m){
					m[docs[a]['moneda']] = []
				}
				m[docs[a]['moneda']].push(docs[a]['value']) // Añadimos el valor al array de la moneda

			}
			return cb(m)
		}
	})
}

function EMA(newFIs,oldFIs,cb){

	var results = {}
	var f = parseFloat

	if (Object.keys(oldFIs).length > 0){

		var first = _.first(oldFIs)
		console.log('First', first)

		if (first.length > PERIODOS_EMA){
		
			_.each(oldFIs,function(v,k){

				var m = {}
				m['values'] = []
				m['period'] = PERIODOS_EMA
				m['values'] = []

				if (k in newFIs){

					m['values'].push(newFIs[k])
				}

				if (v.length > PERIODOS_EMA){

					m['values'] = v // Añadimos los viejos
				}

				var c = f(ema.calculate(m)).toFixed(8)

				if (c == 'NaN'){
					c = 0
				}

				results[k] = c
			})
		}
	}

	return cb(results)
}

function guardar(model,data,ttl){

	var expire = Date.now
	expire += (ttl * 1000) 
	var toCreate = []

	asyncLoop(data,function(item,next){
		
		var m = {}
		m['createAt'] = Date.now()
		m['moneda'] = item.key
		m['value'] = item.value
		m['expireAt'] = ttl

		toCreate.push(m)

    	next()
	},function(){

		model.create(toCreate,function(error,docs){

			if (error) {console.log(error)}

			else {
				console.log('Se han guardado los valores correctamente a' , model.modelName)
			}
		})
	})
}

function velasNecesitadas() {

	if (PERIODOS_EMA == 2){

		return PERIODOS_EMA + 1

	}else {

		return PERIODOS_EMA + 2 

	}
}

module.exports = FI_EMA