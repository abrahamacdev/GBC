'use strict'

// MODULOS EXTERNOS
const _ = require('lodash')
const mongoose = require('mongoose')
const moment = require('moment')
const asynLoop = require('node-async-loop')

// UTILIDADES
const Utils = require('../../Utils.js')
const Config = require(Utils.dirs().CT + 'Config.js')

// MODELO
const velasModel = require(Utils.dirs().modeloMongo + 'VelasModel.js')
const preciosModel = require(Utils.dirs().modeloMongo + 'PreciosModel.js')
const FI_EMA = require(Utils.dirs().estrategias + 'FI_EMA/' + 'FI_EMA.js')

var self
var firstTime = true

var ControlNuevosDatos = function () {

	_.bindAll(this)
	this.FI_EMA = new FI_EMA()
	self = this

}

ControlNuevosDatos.prototype.procesarDatos = function(datos){

	console.time('a')

	if (datos.dataType == Config.dataTypes.candles){

		this.guardarVelas(datos)
	}else {

		this.guardarSummaries(datos)
	}
}

ControlNuevosDatos.prototype.guardarVelas = function(velas){

	console.log('Vamos a guardar velas')

	crearCandlesDB(velas,function(candlesDB){

		if (candlesDB.length > 0){

			velasModel.create(candlesDB,function(error,docs){

				if (error){
					console.log(error)
				}
				else {
					console.log('Se han guardado las velas correctamente ', docs[0])

					if (firstTime == true){
						firstTime = false
					}
					else {

						self.FI_EMA.calcular()
					}					
				}
			})
		}
	})
}

ControlNuevosDatos.prototype.guardarSummaries = function(markets){

	var create = []

	var expire = Date.now()
	expire += (Config.expirePrices * 1000)

	_.each(markets.summaries,function(value,key){

		var summary = {}
		summary['exchange'] = markets.exchange
		summary['moneda'] = key
		summary['fecha'] = markets.horaPeticion
		summary['expireAt'] = expire
		summary['precio'] = value

		create.push(summary)
	})

	preciosModel.create(create,function(error,docs){

		if (error){

			throw error
		}
		else {

			console.log('Se han guardado los precios correctamente ', docs[0])		
		}
	})
}

function crearCandlesDB (velas,cb) {

	var create = []
	var expire = Date.now()
	expire += (Config.expireCandles * 1000) // Dentro de 3 horas


	_.each(velas.candles,function(v,k){

		var vela = {}
		vela['exchange'] = velas.exchange
		vela['moneda'] = k
		vela['fecha'] = velas.horaPeticion
		vela['expireAt'] = expire
		
		if (velas.candles[k]['Candle'] != undefined){

			if ('C' in velas.candles[k]['Candle']) {

				_.each(velas.candles[k]['Candle'],function(value,key){

					vela[key] = value

				})

				create.push(vela)
			}else {

				if (self.lastCandles.length > 0){
					create = lastCandles
				}
			}
		}

		// La vela no tiene ningun valor, buscamos en la anterior tanda
		else {

			if (self.lastCandles != undefined){

				for (let a=0;a<self.lastCandles.length;a++){

					// Si tenemos datos antiguos de la vela, los guardamos  
					if (self.lastCandles[a]['moneda'] == k){

						create.push(self.lastCandles[a])
					}
				}
			}
		}
	})

	self.lastCandles = create

	console.timeEnd('a')

	return cb(create)
}


module.exports = ControlNuevosDatos
