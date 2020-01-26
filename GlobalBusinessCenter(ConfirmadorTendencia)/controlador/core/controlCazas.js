'use strict'

// MODULOS EXTERNOS
const _ = require('lodash')

// UTILIDADES
const Utils = require('../../Utils.js')

// CORE
const CazadorDatos = require('./cazadorDatos.js')

var instancia = undefined // Instancia del controlador de cazadores

function getControlCazas() {

	if (instancia == undefined){

		instancia = new ControlCazas()

	}

	return instancia
}

var ControlCazas = function(){

	_.bindAll(this)

	this.CazadorDatos = CazadorDatos()

	this.CazadorDatos.on('cazado', (datos) => {

		this.emit('cazado', datos)
	})
}

ControlCazas.prototype.empezarCaza = function() {

	console.log('Vamos a salir de caza')
	this.CazadorDatos.cazar()
}

Utils.makeEventEmitter(ControlCazas)

module.exports = getControlCazas