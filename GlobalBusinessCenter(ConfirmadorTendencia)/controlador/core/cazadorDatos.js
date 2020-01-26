'use strict'

// MODULOS EXTERNOS
const _ = require('lodash')
const moment = require('moment')

// UTILIDADES
const Utils = require('../../Utils.js')
const Config = require(Utils.dirs().CT + 'Config.js')

// CORE
const exchanges = require('./exchanges.js')

var instancia = undefined 

function getCazador(){

	if (instancia == undefined) {

		instancia = new CazadorMercado()

	}

	return instancia
}

var CazadorMercado = function () {

	_.bindAll(this)
	this.Exchanges = new exchanges()
	this.Exchanges.on('nuevos precios',this.procesarDatos)

}

Utils.makeEventEmitter(CazadorMercado)

CazadorMercado.prototype.cazar = function() {
	
	console.log('Empezamos la caza')
	this.Exchanges.obtenerMercados()

}

CazadorMercado.prototype.procesarDatos = function(datos,metadatos) {

	var exchange = metadatos.exchange // Nombre del exchange 

	if (this[exchange] == undefined){

		this[exchange] = {}
		this[exchange]['dataType'] = metadatos.dataType
		this[exchange]['exchange'] = exchange
		this[exchange]['horaPeticion'] = metadatos.horaPeticion
	}
	else {

		setTimeout(function(){
			this.procesarDatos(datos,metadatos)
		},100)
	}

	if (metadatos.dataType == Config.dataTypes.candles){

		this[exchange]['candles'] = {}

		var errores = []
		for(let i=0;i<datos.length;i++){

			if (datos[i] == undefined){

				errores.push(datos[i])

			}else {

				this[exchange]['candles'][datos[i]['MarketName']] = datos[i] 
				delete this[exchange]['candles'][datos[i]['MarketName']]['MarketName'] // Borramos el nombre del mercado de la vela

			}
		}

	}else {

		this[exchange]['summaries'] = {}

		for(let i=0;i<datos.length;i++){

			this[exchange]['summaries'][datos[i]['MarketName']] = datos[i]['Last'] 

		}
	}

	this.emit('cazado', this[exchange])
	this[exchange] = undefined
}

module.exports = getCazador