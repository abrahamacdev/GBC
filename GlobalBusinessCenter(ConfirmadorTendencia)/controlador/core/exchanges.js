'use strict'

// MODULOS EXTERNOS
const _ = require('lodash')
const moment = require('moment')
const asyncLoop = require('node-async-loop')

// UTILIDADES
const Utils = require('../../Utils.js')
const Config = require(Utils.dirs().CT + 'Config.js')

var Exchanges = function () {

	_.bindAll(this)
}

Utils.makeEventEmitter(Exchanges)

Exchanges.prototype.obtenerMercados = function() {
	
	this.exs = [] // Exchanges a utilizar en la construccion de velas
	var self = this

	console.log('Obtenemos los mercados')

	// Obtenemos la referencia de todos los exchangers a utilizar
	asyncLoop(Config.exchanges,function(exchange,next){
		
		self.exs.push(require(Utils.dirs().exchanges + exchange + '.js'))

    	next()
	},function(){

		console.log('Ya hemos importado los mercados', self.exs)
		self.getMarkets()	
	})
}

Exchanges.prototype.getMarkets = function () {

	let self = this

	asyncLoop(self.exs,function(exchange,next){
		
		exchange.launch(function(error,data,metadata){

			// TODO Tratar debidamente los exchanges de
			// los que no hemos podido obtener datos
			
			if (error){

				console.log('Ha ocurrido un error a la hora de recuperar los precios de ', metadata['exchange'])

			}else if (data){

				// Emitimos los nuevos precios de cada exchange
				self.emit('nuevos precios',data,metadata)
			}
		})
    	next()
	},function(){})
}

module.exports = Exchanges

