'use strict'

// MODULOS EXTERNOS
const bittrex = require('node-bittrex-api')

// SIMULACION 
const comprobacionCompra = require('../simulacion/comprobacionCompra.js')
const comprobacionVenta = require('../simulacion/comprobacionVenta.js')
const cancelarVenta = require('../simulacion/cancelarVenta.js')
const cancelarCompra = require('../simulacion/cancelarCompra.js')

// UTILIDADES
const Config = require('../../Config.js')

var funciones = {

	/**
	 * 
	 * Obtenemos los datos de una inversion
	 * @param {Map} [invsData] [Datos de la invs a comprobar]
	 * @param {Number} [tipo] [Tipo de invs a comprobar ]
	 *
	 * @callback (error,data)
	 * error-> {Map} (Datos de la inversion fallida)
	 * data-> {Map} (Datos de la inversion con la mutacion pertinente)
	 * 
	 */
	getInvsData: function(invsData,tipo,cb){

		var fun = funciones.getOrder // Por defecto, las comprobaciones se haran a bittrex.com

		if (Config.simulacion == true) {

			switch (tipo) {
				
				case Config.tipoInversiones.compra:

					fun = comprobacionCompra.simular // Seteamos el metodo simulado de compra				
				break;

				case Config.tipoInversiones.venta:
					
					fun = comprobacionVenta.simular	// Seteamos el metodo simulado de venta
				break;				

			}
		}

		fun.call(null,invsData,function(data){

			if (data == undefined){

				return cb (invsData,undefined)
			}else {

				return cb(undefined,invsData)
			}
		})
	},

	getOrder: function(invs,cb){

		var options = {} 

		if (invs != undefined){

			if ("IdVenta" in invs){
				options['uuid'] = invsData['IdVenta']
			}else {
				options['uuid'] = invsData['IdCompra']
			}

			bittrex.getorder(options,function(data,error){
				
				if (error){

					return cb (undefined) 
				}else if (data != null){

					invs['result'] = {}
					invs['result']['Quantity'] = data['result']['Quantity']
					invs['result']['QuantityRemaining'] = data['result']['QuantityRemaining']
					
					if ("IdVenta" in invs){
						invs['result']['Limit'] = data['result']['Limit']
					}
					return cb (invs)
				}
			})
		}
	},

	/**
	 * 
	 * Cancelamos una orden a partir del uuid de la inversion
	 * 
	 * @param  {Map} (invs) [description]
	 * 
	 * @callback(error,cancelada)
	 * error-> #invs
	 * cancelada-> #cancelada
	 * 
	 */
	cancelInvs: function (invs,tipo,cb){

		var fun = funciones.cancelOrder // Por defecto, las comprobaciones se haran a bittrex.com

		if (Config.simulacion == true) {

			switch (tipo) {
				
				case Config.tipoInversiones.compra:

					fun = cancelarCompra.simular // Seteamos el metodo simulado de compra				
				break;

				case Config.tipoInversiones.venta:
					
					fun = cancelarVenta.simular	// Seteamos el metodo simulado de venta
				break;				

			}
		}

		fun.call(null,invs,function(error,cancelada){

			if (error){

				return cb (error,undefined)
			}else {

				return cb(undefined,cancelada)
			}
		})
	},

	cancelOrder: function(invs,cb){

		var options = {}

		if (invs != undefined){

			if ("IdVenta" in invs){
				options['uuid'] = invsData['IdVenta']
			}else {
				options['uuid'] = invsData['IdCompra']
			}

			bittrex.cancel(options,function(data,error){
		      
				// Esperamos a realizar de nuevo la comprobacion
		        if(error){
		        	return callback(invs,undefined)
				}
				
				// Retornamos la compra
		        else {
					return callback(undefined,invs)
				}
			})
		}
	}
}

module.exports = funciones