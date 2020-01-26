'use strict'

const Config = require('../../Config.js')
const Utils = require('../../Utils.js')

/**
 *
 * Simulamos la cancelacion de la venta
 *
 * @param {Map{}} [venta] [Datos de la venta]
 *
 * @callback(error,cancelada)
 * error-> #venta
 * cancelada-> #venta
 * 
 */

module.exports.simular = (venta,callback) => {

	var randomStatus = Utils.getRandomInt(0,100)

	if (randomStatus < 20){

		return callback(venta,undefined)

	}else {

		return callback(undefined,venta)

	}
}