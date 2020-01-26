'use strict'

// MODULOS EXTERNOS
const _ = require('lodash')

// UTILIDADES
const Utils = require('../../Utils.js')
const Config = require(Utils.dirs().CT + 'Config.js')

// MODULOS INTERNOS
const Corazon = require('./corazon.js')
const ProveedorMercado = require('./proveedorMercado.js')
const ControlNuevosDatos = require('./controlNuevosDatos.js')

Utils.connectMongo(function(error){

	if (error){throw error}
})

var Hawk = function (){

	_.bindAll(this)
	this.launch()
}

Hawk.prototype.launch = function() {

	var self = this
	var espera = sincronizarHawk()

	if (espera == 0){
    	
		console.log('Lanzamos el bot, (' + new Date() + ')')

		this.Corazon = new Corazon()
		this.ProveedorMercado = new ProveedorMercado()
		this.ControlNuevosDatos = new ControlNuevosDatos()

		this.ProveedorMercado.on('nuevos datos', this.ControlNuevosDatos.procesarDatos)

		this.Corazon.on('latido', this.ProveedorMercado.empezarCaza)

		this.Corazon.descarga() // Revivimos el corazon
   	}
   	else {

   		console.log('Hay que esperar ' , espera , ' minutos')

   		setTimeout(function(){

   			self.launch()
   		},espera * 60000)
   	}
}

function sincronizarHawk() {

	// 	5min
	if (Config.candleForStrategies == 300){

		var t = new Date().getMinutes() % 5 

		if (t == 0){return 0} // Estamos en un multiplo de 5
		return t // Hay que esperar
	}

	// 30min
	else if (Config.candleForStrategies == 1800){

		var t = new Date().getMinutes() 

		if (t == 30 || t == 0){return 0}

		else {

			if (t > 30) {return 60 - t} // Minutos hasta en punto
			else {return 30 - t}

		}		
	}else {

		return 0

	}
}

module.exports = Hawk
