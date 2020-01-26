'use strict'

// UTILIDADES
const Config = require('../../Config.js')
const Utils = require('../../Utils.js')


/**
 *
 * Simulamos la respuesta de bittrex en la comprobacion de la compra
 * 
 * @param  {Map{}} (datosInversion)
 * 
 * @callback  (datosInversion)
 * datosInversion -> {Map{}}
 * 
 */
module.exports.simular = (datosInversion,callback) => {

	var statusRandom = Utils.getRandomInt(0,100)

	if (Config.simulacionEstricta == true){

		switch (true){

			// Parcial
			case (statusRandom  < 10):

			datosInversion['result'] = {}
			datosInversion['result']['Quantity'] = datosInversion['cantidad']
			datosInversion['result']['QuantityRemaining'] = datosInversion['cantidad'] / 2

			break;


			// Nula
			case (statusRandom >=10 && statusRandom < 40):

			datosInversion['result'] = {}
			datosInversion['result']['Quantity'] = datosInversion['cantidad']
			datosInversion['result']['QuantityRemaining'] = datosInversion['cantidad']

			break;


			// Completa
			case (statusRandom >= 40 && statusRandom <= 90):

			datosInversion['result'] = {}
			datosInversion['result']['Quantity'] = datosInversion['cantidad']
			datosInversion['result']['QuantityRemaining'] = 0


			break;

			// Error
			case (statusRandom > 90):

			datosInversion = undefined

			break;


		} 
	}else {

		switch (true){

			// Nula
			case (statusRandom<2):

			datosInversion['result'] = {}
			datosInversion['result']['Quantity'] = datosInversion['cantidad']
			datosInversion['result']['QuantityRemaining'] = datosInversion['cantidad']

			break;

			// Parcial
			case (statusRandom > 2):

			datosInversion['result'] = {}
			datosInversion['result']['Quantity'] = datosInversion['cantidad']
			datosInversion['result']['QuantityRemaining'] = (datosInversion['cantidad'] / 2).toFixed(8)

			break;

			// Completa
			case (statusRandom == 2):

			datosInversion['result'] = {}
			datosInversion['result']['Quantity'] = datosInversion['cantidad']
			datosInversion['result']['QuantityRemaining'] = 0

			break;

			// Error
			case (statusRandom >= 99):

			datosInversion = undefined

			break;

		}	
	}

	return callback(datosInversion)
} 