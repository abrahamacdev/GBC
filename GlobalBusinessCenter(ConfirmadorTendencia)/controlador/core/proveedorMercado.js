'use strict'

// MODULOS EXTERNOS
const _ = require('lodash')

// UTILIDADES
const Utils = require('../../Utils.js')

// CORE
const ControlCazas = require('./controlCazas.js')

var ProveedorMercado = function () {

	_.bindAll(this)
	this.ControlCazas = ControlCazas() // Obtenemos el control de cazas
	this.ControlCazas.on('cazado', (datos) => {
		
		this.emit('nuevos datos',datos)
	})
}

Utils.makeEventEmitter(ProveedorMercado)

ProveedorMercado.prototype.empezarCaza = function() {

	
	this.ControlCazas.empezarCaza()

}

module.exports = ProveedorMercado