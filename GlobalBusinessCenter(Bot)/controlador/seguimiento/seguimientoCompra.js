'use strict'

// MODULOS EXTERNOS
const bittrex = require('node-bittrex-api')


// SIMULACION
const comprobacionCompras = require('../simulacion/comprobacionCompra.js')
const cancelarCompra = require('../simulacion/cancelarCompra.js')
const compra = require('../simulacion/compra.js')


// MONGO
const obtenerParametros = require('../parametros_mongo/parametros/ObtenerParametros.js')
const parametrosModel = require('../../modelo/Mongo/ParametrosModel.js')
const inversionesModel = require('../../modelo/Mongo/InversionesModel.js')


// UTILS
const Config = require('../../Config.js')
const Utils = require('../../Utils.js')
const btx = require('../peticion/btx.js')
const Rango = require('../workers/rango.js')


var rango = undefined // Rango encargado a este worker


// COMPROBACION ESTADO COMPRAS ----

/**
 *
 * Lanzamos la comprobacion de las compras
 *
 */
function comprobacion () {

	console.log('Llamado ------------------------------------------')

	rango = Rango.getRango()

	var filtros = {}
	filtros['IdUsuario'] = {}
	filtros['IdUsuario']['$gt'] = rango[0]
	filtros['IdUsuario']['$lt'] = rango[1]

	console.log('Filtros ', filtros)
	var query = inversionesModel.find(filtros).exists('IdCompra').lean()
	query.exec(function(error,docs){

		if (error){throw error}

		else {

			if (docs.length > 0){

				comprobarEstado(docs)
			}
		}
	})
}

/**
 * 
 * Comprobamos el estado de las compras
 * 
 * @param [Array[]] {inversiones} {Detalle de todas las inversiones realizada por el rango de usuarios asignado}
 * 
 */
function comprobarEstado(inversiones) {

	var count = 0
	var errores = []
	var results = []

	console.log('A comprobar cccccccccccccc', inversiones)

	for (let a=0;a<inversiones.length;a++){

		process.nextTick(function(){

			obtenerCompras(inversiones[a],function(error,resultado){

				count++

				if (error){

					errores.push(error)
				}
				else {

					results.push(resultado)
				}

				if (count == inversiones.length){

					if (results.length > 0){

						console.log('A procesar ', results)
						console.log('No hemos podido obtener el estado de las siguientes compras', errores)
						procesarRespuestaExchange(results)
					}
				}
			})
		})
	}
}

/*
 * 
 * Obtenemos las compras realizadas con el #idCompra
 * 
 * @param [Map{}] {datosInversion} {Datos de la inversion}
 * 
 * @callback (error,result)
 * error-> #datosInversion
 * result-> {#inversionModel,result:{quantity:xx,quantityRemaining:xx}}
 * 
 */
function obtenerCompras (datosInversion,cb) {
	
	btx.getInvsData(datosInversion,Config.tipoInversiones.compra,function(error,invsData){

		if (error){

			console.log('Invs devuelta con error')
			return cb(error,undefined)
		}else {

			console.log('Invs devuelta sin error')
			return cb(undefined,invsData)
		}
	})
}

/*
 * 
 * Comprobamos el estado de cada compra 
 * 
 * @param Array[] inversiones (Inversiones con los datos )
 * 
 */
function procesarRespuestaExchange (inversiones) {
	
	console.log('Compras a procesar ', inversiones)

	var parciales = [] // Grupo de inversiones que solo han comprado un % del total pedido
	var completas = [] // Grupo de inversiones que han comprado las monedas por completo
	var nulas = [] // Grupo de inversiones que no han comprado ninguna moneda

	for (let a=0;a<inversiones.length;a++){

		process.nextTick(function(){

			if (inversiones[a]['result']['QuantityRemaining'] > 0){				
				// Nula				
				if (inversiones[a]['result']['QuantityRemaining'] == inversiones[a]['result']['Quantity']){
					
					nulas.push(inversiones[a])

				// Parcial
				}else {
					
					parciales.push(inversiones[a])
				}
			// Completa				
			}else {
				
				completas.push(inversiones[a])
			}

			if (a == inversiones.length - 1){

				console.log('Compras completas ', completas)
				console.log('Compras parciales ', parciales)
				console.log('Compras nulas ', nulas)

				if (completas.length > 0){

					comprasCompletas(completas)
				}

				if(parciales.length > 0){

					comprasParciales(parciales)	
				}

				if (nulas.length > 0){

					comprasNulas(nulas)
				}
			}
		})
	}
}

// ---------------------------------



// TRATADO DE LAS COMPRAS ----------

/*
 * 
 * Realizamos una nueva compra con la totalidad 
 * del capital de la compra nula
 * @param Map{} respuestaBittrex
 * 
 */
function comprasNulas (nulas){
	
	var errores = []
	var results = []

	var count = 0

	for (let a=0; a<nulas.length;a++){

		process.nextTick(function(){

			var noGastado = nulas[a]['precioCompra'] * nulas[a]['result']['QuantityRemaining']
		
			nulas[a]['gastado'] = 0
			nulas[a]['noGastado'] = noGastado

			cancelarOrden(nulas[a],function(error,cancelada){

				count++

				if (error){errores.push(error)}
				else {

					results.push(cancelada)

				}
				if (count == nulas.length){

					console.log('Vamos a recomprar las siguientes monedas nulas ', results)
					console.log('No se ha podido cancelar las siguientes inversiones', errores)
					reCompra(results)

				}
			})
		})
	}
}

/*
 * 
 * Comprobamos el estado exacto de la inversion parcial y dependiendo de su 
 * estado, compraremos una nueva o la dejaremos para que se complete
 * 
 * @param Array[] parciales (Todas las monedas que se han comprado en tu totalidad)
 * 
 */
function comprasParciales(parciales){
	
	var  canceladas = [] // Monedas que volver a comprar
	var errores = [] // Monedas que no se han podido cancelar

	var count = 0

	for (let a=0;a<parciales.length;a++){

		process.nextTick(function(){

			var noGastado = parciales[a]['precioCompra'] * parciales[a]['result']['QuantityRemaining']
			var cantidadVendida = parciales[a]['result']['Quantity'] - parciales[a]['result']['QuantityRemaining']
			var gastado = parciales[a]['precioCompra'] * cantidadVendida

			parciales[a]['gastado'] = gastado.toFixed(9)
			parciales[a]['noGastado'] = noGastado.toFixed(9)

			// El monto que nos queda por comprar es menor a 50k satoshis || Lo comprado es menor a 50k satoshis
			if (noGastado <= Config.valoresPreinversion.cantidadMinima || gastado <= Config.valoresPreinversion.cantidadMinima){count++}
			
			// La cantidad por comprar / comprado es mayor a 50k satoshis
			else {
				// Cancelamos la orden
				cancelarOrden(parciales[a],function(error,cancelada){

					count++

					if (error){
						
						errores.push(error)
					}else{
						if (cancelada != undefined){

							canceladas.push(cancelada)
						}
					}

					if (count == parciales.length){

						console.log('Llega a lanzar la recompra', canceladas)
						console.log('No se ha podido cancelar las siguientes inversiones', errores)

						guardarComprado(parciales,function(){})

						reCompra(parciales)
					}
				})	
			}
		})
	}
}

/*
 * 
 * Guardamos las inversiones para analizarlas
 * 
 * @param Array[] completas (Todas las monedas que se han comprado en tu totalidad)
 * 
 */
function comprasCompletas (completas){

	var bulk = inversionesModel.collection.initializeOrderedBulkOp();

	var count = 0

	for (let a=0;a<completas.length;a++){

		process.nextTick(function(){

			var update = completas[a]
			update['IdAnalizar'] = update['IdCompra']
	
			delete update['IdCompra']
			delete update['result']

			var filtros = {'_id': completas[a]['_id']}
			bulk.find(filtros).updateOne(update)

			count++

			if (count == completas.length){

				bulk.execute(function(error,result){

					if (error){console.log(error)}

					else {

						console.log('Se han comprado las monedas en su totalidad')

					}
					/*else {

						console.log('Bulk result ', result.getRawResponse(function(rawResponse){

						}))
					}*/
				})
			}
		})	
	}
}

// -------------------------------



// PROCESO DE RE-COMPRA ----------

/*
 * 
 * Cancelamos una orden a partir de su uuid
 * 
 * @param Map{} compra (Datos de la compra parcial/nula)
 * 
 * @callback (error,cancelada)
 * 
 */
function cancelarOrden (compra,callback){
	
	btx.cancelInvs(compra,Config.tipoInversiones.compra,function(error,cancelada){

		return callback(error,cancelada)

	})
}

/**
 *
 * Recompramos las monedas parciales/nulas
 *
 * @param {Array[]} [compras] [Monedas a comprar]
 * 
 */
function reCompra (compras){

	console.log('A recomprar ', compras)

	// Obtenemos los nombres de las monedas a recomprar
	// sin repeticiones
	nombresDeMonedas(function(monedas){

		console.log('Nombre de las monedas ', monedas)

		// Obtenemos los precios de las monedas que se van a recomprar
		obtencionPrecios(monedas,function(monedasConError,nombresMonedas,preciosMonedas){

			console.log('Monedas ', nombresMonedas)
			console.log('Precios ', preciosMonedas)
			console.log('Con error ', monedasConError)

			// ELiminamos las inversiones que vayan a recomprar una moneda de 
			// la que no hemos podido obtener el precio
			eliminarMonedasConError(monedasConError,function(comprasActualizadas,comprasConError){

				if (comprasConError.length > 0){

					console.log('No podremos recomprar las inversiones con la moneda ', comprasConError)

				}

				// Obtenemos las apiKeys de cada usuario antes de realizar
				// las re-compras
				obtenerUsersKeys(comprasActualizadas,function(parametros){

					var datosMonedas = {}
					datosMonedas['nombres'] = nombresMonedas
					datosMonedas['precios'] = preciosMonedas

					console.log('Preparamos las nuevas compras', parametros)

					// Preparamos las compras 
					prepararCompras(comprasActualizadas,parametros,datosMonedas,function(comprasPreparadas){

						console.log('Compras preparadas', comprasPreparadas)

						// Compramos las monedas que hemos preparado
						comprarMonedas(comprasPreparadas,function(errores,results){
							
							console.log('No se ha podido recomprar las siguientes inversiones', errores)

							// Guardamos las monedas compradas
							guardarMonedas(results)

							// Actualizamos el saldo de las que no se han podido realizar
							actualizarDisponible(errores)
						})
					})
				})
			})
		})
	})

	function nombresDeMonedas (callback){

		var monedas = []

		for (let a=0;a<compras.length;a++){

			process.nextTick(function(){

				if (!Utils.inArray(compras[a]['moneda'],monedas)){

					monedas.push(compras[a]['moneda'])

				}

				if (a == compras.length - 1){

					return callback(monedas)
				}
			})
		}
	}

	function obtencionPrecios (monedas,callback){

		var nombresMonedas = []
		var preciosMonedas = []
		var monedasConError = []


		var count = 0

		for (let i=0;i<monedas.length;i++){

			process.nextTick(function(){

				// Obtenemos el precio de cada moneda
				obtenerNuevoPrecio(monedas[i],function(error,result){

					count++

					if (error){

						console.log(error)
						monedasConError.push(error)

					}else {

						nombresMonedas.push(result['moneda'])
						preciosMonedas.push(result['precio'])

					}

					if (count == monedas.length){

						return callback(monedasConError,nombresMonedas,preciosMonedas)

					}
				})
			})
		}
	}

	function eliminarMonedasConError (monedasConError,callback){

		var conError = [] // Compras con error

		if (monedasConError.length == 0){return callback(compras,conError)}
		else {

			for (let a=0;a<compras.length;a++){

				process.nextTick(function(){

					for (var i=0;i<monedasConError.length;i++){

						if (compras[a]['moneda'] == monedasConError[i]){

							conError.push(compras[a])
							compras.splice(a,1)
							a--

						}
					}

					if (a == compras.length - 1){

						if (compras.length > 0){

							return callback(compras,conError)

						}
					}
				})
			}
		}
	}

	function obtenerUsersKeys (comprasActualizadas,callback){
		
		var users = []

		for (let a=0;a<comprasActualizadas.length;a++){

			if (!Utils.inArray(comprasActualizadas[a]['IdUsuario'],users)){
				users.push(comprasActualizadas[a]['IdUsuario'])
			}
		}

		var filtros = {}
		filtros['$or'] = []

		var projection = {'apiKey':1,'secretKey':1,'_id':1,'falseId':1}

		for (let i=0;i<users.length;i++){

			var m = {}
			m['falseId'] = users[i]
			filtros['$or'].push(m)	

		}


		obtenerParametros.conFiltros(filtros,projection,function(error,docs){

			if (error){console.log(error)}
			else {

				return callback(docs)		

			}
		})
	}
}

/*
 * 
 * Obtenemos el nuevo precio de compra
 * 
 * @param String moneda
 * 
 * @callback (err,result)
 * err--> [String] moneda
 * result--> [Map] {moneda:,precio:}
 * 
 */
function obtenerNuevoPrecio (currency,callback) {
	
	setTimeout(function(){

		var options = {
    
		    market: currency,
		    type: 'sell'
	    
		}

		bittrex.getorderbook(options,function(response,err){

			if (err){
					
				return callback(currency,undefined)
				
			}
			else {
				var ultVenta = Number(response['result'][0]['Rate'])
				
				var result = {}
				result['moneda'] = currency
				result['precio'] = ultVenta.toFixed(8)
				

				return callback(undefined,result)
			}	
		})

	},3)
}

/**
 * 
 * Preparamos las compras que se van a realizar
 * 
 * @param  {Array}   comprasActualizadas [Datos de las compras que obtenimos precios]
 * @param  {Array}   parametros  [Keys de cada uno de los usuarios que va a realizar una nueva compra]
 * @param {Map} [preciosMonedas] [Precios de las monedas que se van a comprar]
 * 
 * @callback (comprasPreparadas)
 * 
 */
function prepararCompras (comprasActualizadas,parametros,preciosMonedas,callback){

	var comprasPreparadas = []

	for (let a=0;a<comprasActualizadas.length;a++){

		process.nextTick(function(){

			// Cada moneda de la que tenemos precios
			for (var i=0;i<preciosMonedas['nombres'].length;i++){

				if (comprasActualizadas[a]['moneda'] == preciosMonedas['nombres'][i]){

					// Cada uno de los parametros
					for (var e=0;e<parametros.length;e++){

						if (parametros[e]['falseId'] == comprasActualizadas[a]['IdUsuario']){

							var m = {}
							m['moneda'] = comprasActualizadas[a]['moneda']
							m['precioCompra'] = preciosMonedas['precios'][i]
							m['cantidad'] = (comprasActualizadas[a]['noGastado'] / preciosMonedas['precios'][i]).toFixed(9)
							m['idAntiguaCompra'] =  comprasActualizadas[a]['_id']
							m['apiKey'] = parametros[e]['apiKey']
							m['secretKey'] = parametros[e]['secretKey']
							m['IdUsuario'] = parametros[e]['falseId']
							m['lastPercW'] = comprasActualizadas[a]['lastPercW']
							m['lastPercSL'] = comprasActualizadas[a]['lastPercSL']
							comprasPreparadas.push(m)

						}
					}
				}
			}
			if (a == comprasActualizadas.length - 1){

				return callback(comprasPreparadas)

			}
		})
	}
}

/**
 * 
 * Recompramos todas las monedas
 * 
 * @param  {Array}   comprasPreparadas [Datos de las compras a realizar]
 *
 * @callback(errores,results)
 * 
 */
function comprarMonedas (comprasPreparadas,callback){

	var count = 0

	var errores = []
	var results = []

	for(let a=0;a<comprasPreparadas.length;a++){

		process.nextTick(function(){

			tradeBuy(comprasPreparadas[a],function(error,result){

				count++
				if (error){

					errores.push(error)

				}else {

					results.push(result)

				}

				if (count == comprasPreparadas.length){

					if (results.length > 0){

						return callback(errores,results)

					}
				}
			})
		})
	}
}

/*
 * 
 * Realizamos una inversion
 * @param Number precio
 * @param String moneda
 * @param Number moneda
 * @callback (result,error)
 * 
 */
function tradeBuy(datosCompra,callback){
	
	var total_inversion = datosCompra['precio'] * datosCompra['cantidad']
	
	if (total_inversion < 0.0005){
		
		return callback(datosCompra,undefined)
		
	}
	
	if (Config.simulacion == false){

		var options = {
	        OrderType: 'LIMIT',
	        TimeInEffect: 'GOOD_TIL_CANCELLED', // supported options are 'IMMEDIATE_OR_CANCEL', 'GOOD_TIL_CANCELLED', 'FILL_OR_KILL'
	        ConditionType: 'NONE', // supported options are 'NONE', 'GREATER_THAN', 'LESS_THAN'
	        Target: 0 // used in conjunction with ConditionType
	    }
	     
	    bittrex.options({

	    	'apiKey': datosCompra['apiKey'],
	    	'secretKey': datosCompra['secretKey']

	    })

	    options['MarketName'] = datosCompra['moneda']
	    options['Rate'] = datosCompra['precio']
	    options['Quantity'] = datosCompra['cantidad']
		
		bittrex.tradebuy(options,function(data,err){
	        
			// Esperamos otro minuto
			if(err){
				
				callback(datosCompra,undefined)
				
			}
			
			else{
				
				if(data['success'] == true){
					
					datosCompra['idCompra'] = data['result']['OrderId']
					return callback (undefined,datosCompra)
				}
			}
		})    
	}else {

		compra.simular(datosCompra,function(simulada){

			if (simulada != undefined){

	                return callback(undefined,simulada)
	            
			}else {

				return callback(simulada,undefined)
			}
		})
	}
}

// -------------------------------




// POST COMPRA -------------------

/**
 *
 * Guardamos las monedas que acabamos de comprar
 *
 * @param {Array} [results] [Monedas recien compradas]
 * 
 */
function guardarMonedas (results) {

	var bulk = inversionesModel.collection.initializeOrderedBulkOp();

	var count = 0

	for (let a=0;a<results.length;a++){

		process.nextTick(function(){

			var antiguoIdCompra = results[a]['idAntiguaCompra']


			var w = (results[a]['precioCompra']*1) * (results[a]['lastPercW']*1 / 100)
            var sl = (results[a]['precioCompra']*1) * (results[a]['lastPercSL']*1 / 100)

            var update = {}
            update['$set'] = {}
            update['$set']['IdCompra'] = results[a]['idCompra']
            update['$set']['metaW'] = (w + (results[a]['precioCompra']*1)).toFixed(8)
            update['$set']['metaSL'] = ((results[a]['precioCompra']*1) + sl).toFixed(8)
            update['$set']['cantidad'] = results[a]['cantidad']
            update['$set']['precioCompra'] = ((results[a]['precioCompra'])*1).toFixed(8)

			var filtros = {'_id': antiguoIdCompra}

			bulk.find(filtros).updateOne(update)

			count++

			if (count == results.length){

				bulk.execute(function(error,result){

					if (error){

						console.log(error)

					}else {

						console.log('Bulk result ', result.getRawResponse(function(rawResponse){}))
					}
				})
			}
		})	
	}
}

/**
 *
 * Guardamos las monedas que se han llegado a comprar
 *
 * @param {Array[]} [parciales] [Compras parciales a guardar]
 *
 * @callback ()
 * 	
 */
function guardarComprado (parciales,callback){

	var create = []

	var count = 0

	for (let a=0;a<parciales.length;a++){

		process.nextTick(function(){

			var m = {}
			m['moneda'] = parciales[a]['moneda']
			m['precioCompra'] = parciales[a]['precioCompra']
			m['cantidad'] = parciales[a]['result']['Quantity'] - parciales[a]['result']['QuantityRemaining']
			m['IdUsuario'] = parciales[a]['IdUsuario']
			m['metaW'] = parciales[a]['metaW']
			m['metaSL'] = parciales[a]['metaSL']
			m['lastPercW'] = parciales[a]['lastPercW']
			m['lastPercSL'] = parciales[a]['lastPercSL']
			m['IdAnalizar'] = parciales[a]['IdCompra']

			create.push(m)

			count++

			if (count == parciales.length){


				console.log('A guardar ', create)
				console.log(a)
				inversionesModel.create(create,function(error,docs){

					if (error){

						console.log('No se ha guardado las compras realizadas exitosamente')

					}
					else {

						return callback()

					}
				})
			}
		})
	}
}

/**
 *
 * Actualizamos el disponible de aquellas cuentas 
 * que no han podido completar una compra en su totalidad
 *
 * @param {Array} [comprasFallidas] [Todas las compras que han tenido problemas para completarse]
 * 
 */
function actualizarDisponible (comprasFallidas){

	var filtros = {}
	filtros['$or'] = []				

	var projection = {'totalDisponible':1,'falseId':1,'_id':1}

	for (let a=0;a<comprasFallidas.length;a++){

		process.nextTick(function(){

			var m = {}
			m['falseId'] = comprasFallidas[a]['IdUsuario']
			filtros['$or'].push(m)

			if (a == comprasFallidas.length - 1){

				// Obtenemos el disponible de cada usuario
				parametrosModel.find(filtros,projection,function(error,docs){

					if (error){console.log(error)}

					else {

						for (let i=0;i<comprasFallidas.length;i++){

							process.nextTick(function(){

								for (var e=0;e<docs.length;e++){

									// Si la compra actual es referente al usuario actual,
									// actualizamos su disponible
									if (comprasFallidas[i]['IdUsuario'] == docs[e]['falseId']){

										docs[e]['totalDisponible'] = docs[e]['totalDisponible'] + (comprasFallidas[i]['noGastado'])

									}
								}

								if (i == comprasFallidas.length - 1){

									var errores = []
									var results = []

									for (let c=0;c<docs.length;c++){

										process.nextTick(function(){

											docs[c].save(function(err,doc){

												if(err){errores.push(err)}

												else {

													results.push(doc)

												}

												if (c == docs.length - 1){

													console.log(' Errores en la actualizacion del disponible ', errores)
													console.log('Se ha actualizado correctamente el saldo de ', results)
													// TODO Tratar de forma pertinente

												}
											})
										})
									}
								}
							})
						}
					}
				})
			}
		})	
	}
}

// ------------------------------- 

module.exports = comprobacion
module.exports.obtenerNuevoPrecio = obtenerNuevoPrecio