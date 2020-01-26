'use strict'

// MODULOS EXTERNOS
const uuid = require('uuid/v4')

// Utils
const Config = require('../../Config.js')
const Utils = require('../../Utils.js')

/**
 * 
 * Simulamos una venta
 *
 * @param {Map{}} [datosVenta] [Datos de la venta a realizar]
 *
 * @callback(simulada)
 * simulada-> #datosVenta
 * 
 */
module.exports.simular = (datosVenta,callback) => {

	var statusRandom = Utils.getRandomInt(0,100)

	if(Config.simulacionEstricta == false){

		switch (true){

			case (statusRandom > 0):

			datosVenta['idVentaNuevo'] = uuid()

			break;

			case (statusRandom == 0):

			datosVenta = undefined

			break;
		}

	}else {

		switch (true){

			case (statusRandom > 20):

			datosVenta['idVentaNuevo'] = uuid()

			break;

			case (statusRandom <= 20):

			datosVenta = undefined

			break;
		}

	}

	console.log('Return venta simulada ', datosVenta)

	return callback(datosVenta)
}