'use strict'

// MODULOS EXTERNOS
const _ = require('lodash')
const moment = require('moment')

// UTILIDADES
const Utils = require('../../Utils.js')
const Config = require(Utils.dirs().CT + 'Config.js') 

var tickRate = Config.tickRate // Tiempo entre latidos

var Heart = function () {
	this.ultimoLatido = false
	_.bindAll(this)

}

Utils.makeEventEmitter(Heart);

Heart.prototype.descarga = function() {
 	this.latir();
}

Heart.prototype.latir = function() {
 	setInterval(
    	this.latido,
    	moment.duration(tickRate, 's')
 );

 	// Lanzamos el primer latido
	_.defer(this.latido);
}

Heart.prototype.latido = function() {
	if (this.ultimoLatido){
		// Comprobamos que el ultimo latido no tenga mas de "tickRate * 3" 
		// segundos de antiguedad (Actualmente 1 min)
		if(this.ultimoLatido < moment().unix() - tickRate * 3){
			process.exit()
		}
	}

	this.ultimoLatido = moment().unix();
  	this.emit('latido');
}

module.exports = Heart;
