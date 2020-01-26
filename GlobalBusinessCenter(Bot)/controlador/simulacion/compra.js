'use strict'

// MODULOS EXTERNOS
const uuid = require('uuid/v4')

// Utils
const Config = require('../../Config.js')
const Utils = require('../../Utils.js')

/**
 * 
 * Simulamos una compra
 *
 * @param {Map{}} [datosCompra] [Datos de la compra a realizar]
 *
 * @callback(simulada)
 * simulada-> #datosCompra
 * 
 */
module.exports.simular = (datosCompra,callback) => {

	var statusRandom = Utils.getRandomInt(0,100)

	if(Config.simulacionEstricta == false){

		switch (true){

			case (statusRandom > 2):

			datosCompra['idCompra']	= uuid()

			break;

			case (statusRandom == 0):

			datosCompra = undefined

			break;
		}

	}else {

		switch (true){

			case (statusRandom >= 20):

			datosCompra['idCompra']	= uuid()

			break;

			case (statusRandom < 20):

			datosCompra = undefined

			break;
		}

	}

	console.log('Return compra simulada ', datosCompra)

	return callback(datosCompra)
}