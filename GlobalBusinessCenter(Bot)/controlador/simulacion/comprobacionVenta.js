'use strict'

// UTILIDADES
const Config = require('../../Config.js')
const Utils = require('../../Utils.js')


/**
 *
 * Simulamos la respuesta de bittrex en la comprobacion de la venta
 * 
 * @param  {Map{}} (datosInversion)
 * @callback  (datosInversion)
 * datosInversion -> {Map{}}
 * 
 */
module.exports.simular = (datosInversion,callback) => {

	var statusRandom = Utils.getRandomInt(0,100)

	if (Config.simulacionEstricta == true){

		switch (true){

			// Parcial
			case (statusRandom < 10):

			datosInversion['result'] = {}
			datosInversion['result']['Quantity'] = datosInversion['cantidad']
			datosInversion['result']['QuantityRemaining'] = datosInversion['cantidad'] / 2
			datosInversion['result']['Limit'] = datosInversion['precioVenta']

			break;


			// Nula
			case (statusRandom >= 10 && statusRandom < 40):

			datosInversion['result'] = {}
			datosInversion['result']['Quantity'] = datosInversion['cantidad']
			datosInversion['result']['QuantityRemaining'] = datosInversion['cantidad']
			datosInversion['result']['Limit'] = datosInversion['precioVenta']

			break;

			// Completa
			case (statusRandom >=40 && statusRandom <= 90):

			datosInversion['result'] = {}
			datosInversion['result']['Quantity'] = datosInversion['cantidad']
			datosInversion['result']['QuantityRemaining'] = 0
			datosInversion['result']['Limit'] = datosInversion['precioVenta']


			break;

			// Error
			case (statusRandom > 90):

			datosInversion = undefined

			break;


		} 
	}else {

		switch (true){

			// Nula
			case (statusRandom<1):

			datosInversion['result'] = {}
			datosInversion['result']['Quantity'] = datosInversion['cantidad']
			datosInversion['result']['QuantityRemaining'] = datosInversion['cantidad']
			datosInversion['result']['Limit'] = datosInversion['precioVenta']

			break;

			// Parcial
			case (statusRandom >= 1 && statusRandom < 97):

			datosInversion['result'] = {}
			datosInversion['result']['Quantity'] = datosInversion['cantidad']
			datosInversion['result']['QuantityRemaining'] = (datosInversion['cantidad'] / 2).toFixed(8)
			datosInversion['result']['Limit'] = datosInversion['precioVenta']

			break;

			// Completa
			case (statusRandom >=97  && statusRandom < 99):

			datosInversion['result'] = {}
			datosInversion['result']['Quantity'] = datosInversion['cantidad']
			datosInversion['result']['QuantityRemaining'] = 0
			datosInversion['result']['Limit'] = datosInversion['precioVenta']

			break;

			// Error
			case (statusRandom >= 99):

			datosInversion = undefined

			break;

		}	
	}

	return callback(datosInversion)

}