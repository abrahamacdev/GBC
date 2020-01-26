'use strict'

const Config = require('../../Config.js')
const Utils = require('../../Utils.js')

/**
 *
 * Simulamos la cancelacion de la compra
 *
 * @param {Map{}} [compra] [Datos de la compra]
 *
 * @callback(error,cancelada)
 * error-> #compra
 * cancelada-> #compra
 * 
 */

module.exports.simular = (compra,callback) => {

	var randomStatus = Utils.getRandomInt(0,100)

	if (randomStatus < 20){

		return callback(compra,undefined)

	}else {

		return callback(undefined,compra)

	}
}