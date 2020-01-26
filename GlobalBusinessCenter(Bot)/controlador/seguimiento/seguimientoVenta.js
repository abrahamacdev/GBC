'use strict'

// MODULOS EXTERNOS
const bittrex = require('node-bittrex-api')

// MONGO 
const inversionesModel = require('../../modelo/Mongo/InversionesModel.js')
const obtenerParametros = require('../parametros_mongo/parametros/ObtenerParametros.js')
const obtenerInversiones = require('../parametros_mongo/inversiones/ObtenerInversiones.js')
const actualizarSaldo = require('../parametros_mongo/parametros/ActualizarTotalDisponible.js')
const eliminarInversiones = require('../parametros_mongo/inversiones/EliminarInversiones.js')

// SIMULACION
const venta = require('../simulacion/venta.js')
const comprobacionVenta = require('../simulacion/comprobacionVenta.js')
const cancelarVenta = require('../simulacion/cancelarVenta.js')

// ANALIZADOR
const getBitcoinPrices = require('../peticion/getBitcoinPrices.js')

// UTILS
const Config = require('../../Config.js')
const Utils = require('../../Utils.js')
const Rango = require('../workers/rango.js')

var rango // Rango de usuarios definido al worker

// COMPROBACION ESTADO VENTAS -----

/*
 * 
 * Lanzamos la comprobacion de las ventas
 * 
 * 
 */
function comprobacion() {
	
    rango = Rango.getRango()

	var filtros = {}
	filtros['IdUsuario'] = {}
	filtros['IdUsuario']['$gt'] = rango[0]
	filtros['IdUsuario']['$lt'] = rango[1]

	console.log('Filtros ', filtros)
	var query = inversionesModel.find(filtros).exists('IdVenta').lean()
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
 * Comprobamos el estado de las ventas
 * 
 * @param [Array[]] {inversiones} {Detalle de todas las inversiones realizada por el rango de usuarios asignado}
 * 
 */
function comprobarEstado(inversiones) {
	
	console.log('Inversiones a comprobar', inversiones)

	//var errores = []
	var results = []

	var count = 0

	for (let a=0;a<inversiones.length;a++){

		process.nextTick(function(){

			obtenerVentas(inversiones[a],function(error,resultado){

				count++

				if (error){

					//errores.push(error)
					console.log(error)
				}
				else {

					results.push(resultado)

				}

				if (count == inversiones.length){

					if (results.length > 0){

						console.log('A procesar ', results)
						
						procesarRespuestaExchange(results)

					}
				}
			})
		})
	}
}

/*
 * 
 * Obtenemos las ventas realizadas con el #idVenta
 * 
 * @param [Map{}] {datosInversion} {Datos de la inversion}
 * 
 * @callback (error,result)
 * error-> #datosInversion
 * result-> {#datoSInversion,result:{quantity:xx,quantityRemaining:xx}}
 * 
 */
function obtenerVentas (datosInversion,callback) {
	
	if (Config.simulacion == true){

		comprobacionVenta.simular(datosInversion,function(ventaSimulada){

			if (ventaSimulada == undefined){

				return callback(datosInversion,undefined)

			}else {

				return callback(undefined,ventaSimulada)

			}
		})
	}else {

		var options = {
			
			uuid: datosInversion['IdVenta']
			
		}

		bittrex.getorder(options,function(data,error){
			
			if (error){
				
				return callback(datosInversion,null) 
				
			}else if (data != null){
				
				datosInversion['result'] = {}
				datosInversion['result']['Limit'] = data['result']['Limit']
				datosInversion['result']['Quantity'] = data['result']['Quantity']
				datosInversion['result']['QuantityRemaining'] = data['result']['QuantityRemaining']
				return callback (null,datosInversion)
			}
		})
	}
}

/*
 * 
 * Comprobamos el estado de cada venta 
 * 
 * @param Array[] inversiones (Inversiones con los datos)
 * 
 */
function procesarRespuestaExchange (inversiones) {
	
	var parciales = [] // Grupo de inversiones que solo han vendido un % del total pedido
	var completas = [] // Grupo de inversiones que han vendido las monedas por completo
	var nulas = [] // Grupo de inversiones que no han vendido ninguna moneda

	var aCount = 0

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

			aCount++

			if (aCount == inversiones.length){


				if (completas.length > 0){

					console.log('Ventas completas ', completas)
					ventasCompletas(completas)

				}
				if(parciales.length > 0){

					console.log('Ventas parciales ', parciales)
					ventasParciales(parciales)	

				}

				if (nulas.length > 0){

					console.log('Ventas nulas ', nulas)
					ventasNulas(nulas)

				}
			}
		})
	}
}

// --------------------------------
 

// TRATADO DE LAS VENTAS ----------

/*
 * 
 * Realizamos una nueva venta con la totalidad de las monedas 
 * que poseemos
 * 
 * @param Map{} respuestaBittrex
 * 
 */
function ventasNulas (nulas){
	
	var errores = [] // Monedas que no se han podido cancelar
	var nuevaVenta = [] // Monedas canceladas, preparadas para una nueva venta

	var count = 0

	for (let a=0;a<nulas.length;a++){

		process.nextTick(function(){

			var noVendido = nulas[a]['result']['QuantityRemaining'] // Monedas aun no vendidas
		
			nulas[a]['noVendido'] = noVendido

			cancelarOrden(nulas[a],function(error,cancelada){

				count++

				if (error){errores.push(error)}
				else {

					nuevaVenta.push(cancelada)

				}
				if (count == nulas.length){

					reVenta(nuevaVenta)

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
function ventasParciales(parciales){
	
	var nuevaVenta = [] // Monedas que volver a vender
	var errores = [] // Monedas que no se han podido cancelar
	
	var count = 0

	for (let a=0;a<parciales.length;a++){

		process.nextTick(function(){

			// Unidades de la moneda ya vendida
			var yaVendido = parciales[a]['result']['Quantity'] - parciales[a]['result']['QuantityRemaining'] 
			// Cantidad total ya vendida (en BTC)
			var cantYaVendida = yaVendido *  parciales[a]['result']['Limit'] 

			// Cantidad total por vender (en BTC)
			var cantPorVender = parciales[a]['result']['QuantityRemaining'] * parciales[a]['result']['Limit']
			// Monedas aun no vendidas
			var noVendido = parciales[a]['result']['QuantityRemaining'] 
		
			// Unidades no vendidas
			parciales[a]['noVendido'] = noVendido
			// Cantidad totoal ya vendida (en BTC's)
			parciales[a]['cantYaVendida'] = cantYaVendida

			// El monto que nos queda por vender es menor a 50k satoshis
			if (cantPorVender <= Config.valoresPreinversion.cantidadMinima){}
			
			// La cantidad por vender es mayor a 50k satoshis
			else {
				// Cancelamos la orden
				cancelarOrden(parciales[a],function(error,cancelada){

					count++

					if (error){
						
						errores.push(error)
						
					}else{
						
						nuevaVenta.push(cancelada)

					}

					if (count == parciales.length){

						console.log('Datos de las parciales', nuevaVenta)
						console.log('No hemos podido cancelas las siguientes inversiones ', errores)

						// Iniciamos el proceso de re-venta
						reVenta(nuevaVenta)

						// Actualizamos el saldo con la #cantYaVendida
						actualizarSaldoUsuarios(nuevaVenta,function(errores){

							// TODO Como tratar las inversiones que no han actualizado el saldo
							// con la cantidad ya vendida

						})
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
function ventasCompletas (completas){

	var aOperar = [] // Todos los usuarios a los que modificar el saldo

	var ids = [] // Ids de los usuarios ya contados
	var montoXUsuario = [] // Monto de cada usuario

	var count = 0

	for (let a=0;a<completas.length;a++){

		process.nextTick(function(){

			// Unidades de la moneda ya vendida
			var yaVendido = completas[a]['result']['Quantity'] - completas[a]['result']['QuantityRemaining'] 
			// Cantidad total ya vendida (en BTC)
			var cantYaVendida = (yaVendido * completas[a]['result']['Limit'])*1 

			// No hemos contado al usuario, añadamos su #IdUsuario y #cantYaVendida
			if (!Utils.inArray(completas[a]['IdUsuario'],ids)){

				ids.push(completas[a]['IdUsuario'])

				montoXUsuario.push(cantYaVendida.toFixed(10))

				count++

			}

			// Ya hemos contado al usuario, sumemos a su monto
			else {

				for (let i=0;i<ids.length;i++){

					process.nextTick(function(){

						if (completas[a]['IdUsuario'] == ids[i]){

							count++
							montoXUsuario[i] = (montoXUsuario[i]*1 + cantYaVendida*1).toFixed(10)

						}
						
						if (count == completas.length){

							console.log('Finaliza')
							finalizar()

						}
					})
				}
			}

			if (count == completas.length){
				console.log('Finaliza')
				finalizar()

			}	
		})		
	}
	

	function finalizar(){

		console.log('Count ', count , ' ---------------------------')
		console.log('Ids de los usuarios ', ids)
		console.log('Monto de cada usuario ', montoXUsuario)

		// Preparamos y operamos sobre el saldo del usuario
		prepararAOperar(ids,montoXUsuario,function(conError){

			if (conError.length > 0){

				console.log('No se ha podido actualizar el saldo de los siguiente usuarios ', conError)
				
			}else if (conError.length == 0){

				var ids = [] // Ids de las inversiones a eliminar
				var count = 0

				Utils.easyLoopAsync(completas.length,function(a){

					ids.push(completas[a])
					count++

					if (count == completas.length){

						eliminarInversiones.enBatch(ids,function(noEliminadas,eliminadas){

							if (noEliminadas != undefined){

								console.log('NO se han podido eliminar las siguiente inversiones', noEliminadas)
							
							}else {

								console.log('Se han eliminado correctamente las siguientes inversiones', eliminadas)

							}
						})
					}
				})	
			}
		})
	}
}
	
// -------------------------------- 
 

// PROCESO DE PRE-RE-VENTA --------

/**
 *
 * ReVendemos las monedas parciales/nulas
 *
 * @param {Array[]} [ventas] [Monedas a vender]
 * 
 */
function reVenta (ventas){

	// Obtenemos los nombres de las monedas a re-vender
	// sin repeticiones
	nombresDeMonedas(function(monedas){

		// Obtenemos los precios de las monedas que se van a re-vender
		obtencionPrecios(monedas,function(monedasConError,nombresMonedas,preciosMonedas){

			console.log('Monedas con error', monedasConError)
			console.log('Nombres de las monedas a revender ', nombresMonedas)
			console.log('Precios de las monedas a revender ', preciosMonedas)

			// ELiminamos las inversiones que vayan a re-vender una moneda de 
			// la que no hemos podido obtener el precio
			eliminarMonedasConError(monedasConError,function(ventasActualizadas,ventasConError){

				if (ventasConError.length > 0){

					// TODO Tratar a las inversiones de las que no disponemos el
					// valor actual de su moneda

				}
				
				console.log('Obtenemos las keys de los usuarios de las siguientes ventas ', ventasActualizadas)

				// Obtenemos las apiKeys de cada usuario antes de realizar
				// las re-ventas
				obtenerUsersKeys(ventasActualizadas,function(parametros){

					var datosMonedas = {}
					datosMonedas['nombres'] = nombresMonedas
					datosMonedas['precios'] = preciosMonedas

					console.log('Keys de los usuarios ', parametros)

					// Preparamos las ventas 
					prepararVentas(ventasActualizadas,parametros,datosMonedas,function(ventasARealizar){

						console.log('Ventas preparadas' , ventasARealizar)

						// Vendemos las monedas que hemos preparado
						venderMonedas(ventasARealizar,function(fallidas,results){

							if (fallidas.length > 0){

								console.log('No se ha podido realizar las siguientes ventas', fallidas)
								// TODO Tratar de alguna manera a los usuarios que no han podido
								// re-vender las monedas

							}

							// Guardamos el nuevo estado de las ventas
							actualizarEstadoVentas(results,function(errores){

								if (errores){

									// TODO Tratar las inversiones que no hemos podido actualizar
									// su estado

								}
							})
						})
					})
				})
			})
		})
	})

	function nombresDeMonedas (callback){

		var monedas = []

		for (let a=0;a<ventas.length;a++){

			process.nextTick(function(){

				if (!Utils.inArray(ventas[a]['moneda'],monedas)){

					monedas.push(ventas[a]['moneda'])

				}

				if (a == ventas.length - 1){

					return callback(monedas)
				}
			})
		}
	}

	function obtencionPrecios (monedas,callback){

		var nombresMonedas = []
		var preciosMonedas = []
		var monedasConError = []

		// Datos actuales de las monedas
		getBitcoinPrices(function(error,currencies){

			if (error){
				console.log(error)
			}else {

				if (currencies.length > 0){

					var count = 0
					Utils.easyLoopAsync(monedas.length,function(a){

						Utils.easyLoopAsync(currencies.length,function(i){

							if (monedas[a] == currencies[i]['MarketName']){

								console.log(currencies[i])
								nombresMonedas.push(currencies[i]['MarketName'])
								preciosMonedas.push(currencies[i]['Bid'])

								count++

								if (count == monedas.length){

									return callback(monedasConError,nombresMonedas,preciosMonedas)

								}
							}
						})
					})
				}
			}
		})
	}

	function eliminarMonedasConError (monedasConError,callback){

		var conError = [] // Ventas con error (a la hora de obtener el precio nuevo)

		if (monedasConError.length == 0){return callback(ventas,conError)}
		else {

			var count = 0

			for (let a=0;a<ventas.length;a++){

				process.nextTick(function(){

					for (var i=0;i<monedasConError.length;i++){

						if (ventas[a]['moneda'] == monedasConError[i]){

							conError.push(ventas[a])
							ventas.splice(a,1)
							a--

						}
					}

					count++

					if (count == ventas.length){

						if (ventas.length > 0){

							return callback(ventas,conError)

						}
					}
				})
			}
		}
	}

	function obtenerUsersKeys (ventasActualizadas,callback){

		var users = []

		for (let a=0;a<ventasActualizadas.length;a++){

			if (!Utils.inArray(ventasActualizadas[a]['IdUsuario'],users)){
				users.push(ventasActualizadas[a]['IdUsuario'])
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

			if (error){

				// TODO No hemos podido obtener los parametros
				// de los usuarios
				console.log('No hemos podido obtener los parametros de los usuarios antes de re-vender') 
				console.log(error)

			}
			else {

				return callback(docs)		

			}
		})
	}
}

/*
 * 
 * Cancelamos la orden a partir de su OrderId
 * @param Map{} inversion [Datos de la inversion]
 * @callback (error,result)
 * error-->#inversion
 * result-->#inversion
 * 
 */
function cancelarOrden (inversion,callback){
    
	if (Config.simulacion == false){

		var options = {
	            uuid:inversion['IdVenta']
	    }
	    
	    bittrex.cancel(options,function(data,error){
	        
	        if (error) {return callback(inversion,undefined)}
		
			else {
				
				if (data['success'] == true){

					return callback(undefined,inversion)

				}
			}
	    })

	}else {

		cancelarVenta.simular(inversion,function(error,cancelada){

			if (error){return callback(error,undefined)}

			else {return callback(undefined,cancelada)}

		})
	}
}

/*
 * 
 * Obtenemos el nuevo precio de venta
 * 
 * @param String moneda
 * 
 * @callback (err,result)
 * err--> [String] moneda
 * result--> [Map] {moneda:,precio:}
 * 
 */
function obtenerNuevoPrecio (moneda,callback) {
	
	setTimeout(function(){

		var options = {
    
		    market: moneda,
		    type: 'buy'

		}
		bittrex.getorderbook(options,function(response,err){
			
			if (err){
					
				return callback(moneda,undefined)
				
			}
			else {
				var ultCompra = Number(response['result'][0]['Rate'])
				
				var result = {}
				result['moneda'] = moneda
				result['precio'] = ultCompra.toFixed(8)
				
				return callback(undefined,result)
			}	
		})
	},20)
}

/**
 * 
 * Preparamos las ventas que se van a realizar
 * 
 * @param  {Array} ventasActualizadas [Datos de las ventas que obtenimos precios]
 * @param  {Array} parametros [Keys de cada uno de los usuarios que va a realizar una nueva compra]
 * @param {Map} [preciosMonedas] [Precios de las monedas que se van a comprar]
 * 
 * @callback (ventasARealizar)
 * ventasARealizar--> {Array[]} [Datos actualizados de la venta]
 * 
 */
function prepararVentas (ventasActualizadas,parametros,preciosMonedas,callback){

	for (let a=0;a<ventasActualizadas.length;a++){

		process.nextTick(function(){

			// Cada moneda de la que tenemos precios
			for (var i=0;i<preciosMonedas['nombres'].length;i++){

				if (ventasActualizadas[a]['moneda'] == preciosMonedas['nombres'][i]){

					// Cada uno de los parametros que van a re-vender
					for (var c=0;c<parametros.length;c++){

						// El usuario actual corresponde con los parametros actuales
						if (parametros[c]['falseId'] == ventasActualizadas[a]['IdUsuario']){

							// Monedas que tenemos actualmente
							ventasActualizadas[a]['cantidad'] = ventasActualizadas[a]['noVendido']
							// Precio al que se vendera la moneda 
							ventasActualizadas[a]['precioVenta'] = preciosMonedas['precios'][i]  

							ventasActualizadas[a]['apiKey'] = parametros[c]['apiKey']
							ventasActualizadas[a]['secretKey'] = parametros[c]['secretKey']

						}

					}	
				}
			}
			if (a == ventasActualizadas.length - 1){

				return callback(ventasActualizadas)

			}
		})
	}
}

// -------------------------------- 


// PROCESO DE RE-VENTA ------------
 
/**
 *
 * Vendemos las monedas que nos quedan 
 *
 * @param {Array[]} [ventasARealizar] [Actualizacion del antiguo estado de las inversiones en venta]
 *
 * @callback (fallidas,results)
 * fallidas--> {Array[]} [Inversiones que no se han podido vender]
 * results--> {Array[]} [Inversiones que se han vedido correctamente]
 * 
 */
function venderMonedas (ventasARealizar,callback){

	var fallidas = [] // Inversiones que no se han podido vender
	var results = [] // Inversiones vendidas correctamente

	var count = 0
	for (let a=0;a<ventasARealizar.length;a++){

		process.nextTick(function(){

			tradeSell(ventasARealizar[a],function(fallida,result){

				count++

				if (fallida) {fallidas.push(fallida)}
				else {

					results.push(result)

				}

				if (count == ventasARealizar.length){

					return callback(fallidas,results)

				}
			})
		})
	} 
}

/*
 * 
 * Realizamos una inversion
 * 
 * @param {Map{}} (inversion) [Datos de la venta a realizar] 
 * 
 * @callback (error,result)
 * error-->#inversion
 * result-->#inversion
 * 
 */
function tradeSell(datosVenta,callback){
	
	if (Config.simulacion == false){

		var options = {
	        OrderType: 'LIMIT',
	        TimeInEffect: 'GOOD_TIL_CANCELLED', // supported options are 'IMMEDIATE_OR_CANCEL', 'GOOD_TIL_CANCELLED', 'FILL_OR_KILL'
	        ConditionType: 'NONE', // supported options are 'NONE', 'GREATER_THAN', 'LESS_THAN'
	        Target: 0 // used in conjunction with ConditionType
	    }

	    bittrex.options({

	    	'apiKey': datosVenta['apiKey'],
	    	'secretKey': datosVenta['secretKey']

	    })
	        
	    options['MarketName'] = datosVenta['moneda']
	    options['Rate'] = datosVenta['precioVenta']
	    options['Quantity'] = datosVenta['cantidad']
		
		bittrex.tradesell(options,function(data,err){
	        
			// Esperamos otro minuto
			if(err){return callback(datosVenta,undefined)}
			
			else{
				
				if(data['success'] == true){
			
					datosVenta['idVentaNuevo'] = data['result']['OrderId']

					delete datosVenta['apiKey']
					delete datosVenta['secretKey']

					return callback(undefined,datosVenta)

				}
			}
		})
	}else  {

		venta.simular(datosVenta,function(simulada){

			if (simulada == undefined){

				return callback(datosVenta,undefined)

			}else {

				return callback(undefined,datosVenta)								

			}
		})
	}    
}

// --------------------------------


// PROCESO DE POST-RE-VENTA -------

/**
 *
 * Actualizamos el nuevo estado de las ventas
 *
 * @param {Array[]} [ventasRealizadas] [Monedas recien re-vendidas]
 *
 * @callback(errores)
 * errores--> {Array[]} [Ventas que no hemos podido actualizar]
 * 
 */
function actualizarEstadoVentas (ventasRealizadas,callback){

	var errores = [] // Ventas que no hemos podido actualizar

	var filtros = {}
	filtros['$or'] = []

	var aCount = 0

	for (let a=0;a<ventasRealizadas.length;a++){

		process.nextTick(function(){

			var m = {}
			m['_id'] = ventasRealizadas[a]['_id']
			filtros['$or'].push(m)			

			aCount++

			if (aCount == ventasRealizadas.length){

				obtenerInversiones.conFiltros(filtros,function(error,docs){

					if (error){return callback (undefined)}

					else {

						var iCount = 0

						for (let i=0;i<docs.length;i++){

							process.nextTick(function(){

								for (var e=0;e<ventasRealizadas.length;e++){

									// Si la inversion corresponde con la venta que acabamos
									// de realizar
									if (ventasRealizadas[e]['_id'].toString() == docs[i]['_id']){

										console.log('COinciden los ids????????????', ventasRealizadas[e]['_id'].toString() == docs[i]['_id'])

										if (ventasRealizadas[e]['idVentaNuevo'] == undefined){

											console.log('333333333333333¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡')

										}
										// Seteamos el nuevo idVenta
										docs[i]['IdVenta'] = ventasRealizadas[e]['idVentaNuevo']
										// Seteamos la cantidad de la que disponemos actualmente
										docs[i]['cantidad'] = ventasRealizadas[e]['cantidad']
										// Seteamos el precio al que se esta vendiendo la moneda
										docs[i]['precioVenta'] = ventasRealizadas[e]['precioVenta']

										docs[i]['IdAnalizar'] = undefined


									}
								}

								iCount++

								if (iCount == docs.length){

									var cCount = 0

									for (let c=0;c<docs.length;c++){

										process.nextTick(function(){

											guardarNuevoEstado(docs[c],function(error){

												cCount++
												if (error){errores.push(error)}

												if (cCount == docs.length){

													return callback(errores)

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

/**
 * 
 * Guardaremos el nuevo estado de las ventas recien realizadas 
 *
 * @param {Mongo Object} [inversion] [Datos de la inversion a guardar]
 * 
 * @callback(error)
 * error-->#inversion
 * 
 */
function guardarNuevoEstado(inversion,callback){

	console.log('A guardar ', inversion)

	delete inversion['IdAnalizar']

	var update = {}
	update['$set'] = inversion
	update['$unset'] = {IdAnalizar : 1} 

	inversionesModel.update({_id:inversion['_id']},update,function(err,doc){

		if (err){

			console.log(err)
			return callback(inversion)

		}
		else {

			return callback(undefined)

		}
	})
}	

/**
 *
 * Actualizamos el saldo a partir de la cantidad ya vendida
 *
 * @param {Array[]} [datosInversiones] [Datos de las inversiones a las que actualizar el saldo]
 *
 * @callback(errores)
 * 
 */
function actualizarSaldoUsuarios (datosInversiones,callback){
	
	var aOperar = [] // Todos los usuarios a los que modificar el saldo

	var ids = [] // Ids de los usuarios ya contados
	var montoXUsuario = [] // Monto de cada usuario

	var count = 0

	for (let a=0;a<datosInversiones.length;a++){

		process.nextTick(function(){

			var coincide = false

			for (let i = 0; i < ids.length; i++) {
				
				if (ids[i] == datosInversiones[a]['IdUsuario']){

					montoXUsuario[i] = montoXUsuario[i] + datosInversiones[a]['cantYaVendida']
					coincide = true
					count++

				}
			}

			if (coincide == false){

				ids.push(datosInversiones[a]['IdUsuario'])
				montoXUsuario.push(datosInversiones[a]['cantYaVendida'])
				count++
			}

			coincide == false

			if (count == datosInversiones.length){

				console.log('Cantidades a operar ', ids)
				console.log(montoXUsuario)

				prepararAOperar(ids,montoXUsuario,function(conError){



				})
			}
		})		
	}
}

/**
 *
 * Preparamos el monto a operar en el saldo del usuario
 *
 * @param {Array[]} [Id's] [Id's de los usuarios en los que operar]
 * @param {Array[]} [montoXUsuario] [Cantidad a operar de cada usuario]
 *
 * @callback(conError)
 * conError--> {Array[]} [Usuarios a los que no se le ha podido actulaizar le disponible]
 * 
 */
function prepararAOperar (ids,montoXUsuario,callback) {

	var users = []

	var eCount = 0

	for (let e=0;e<ids.length;e++){

		process.nextTick(function(){

			var m = {}
			m['id'] = ids[e]
			m['monto'] = montoXUsuario[e]
			users.push(m)

			eCount++

			if (eCount == ids.length){

				console.log('Saldos a actualizar ', users)
				actualizarSaldo.enBatch(users,Config.tipoOpSaldo.suma,function(conError,actualizados){

					//return callback(conError)

					if (conError == undefined && actualizados == undefined){

						// TODO Volver a intentar la actualizacion


					}else if (conError.length > 0){

						// TODO Tratar a los usuarios que tuvieron problemas para
						// actualizar el saldo
						console.log('Con error ', conError)
						return callback(conError)

					}else if (actualizados.length > 0){

						// TODO Se han actualizado los saldo exitosamente
						console.log('Se han actualizado todos los saldos correctamente')
						return callback([])

					}
					else {


						// TODO No se ha actualizado ningun usuario
						console.log('No se ha podido actualizar ningun saldo')

					}
				})
			}
		})
	}
}

// -------------------------------- 


module.exports = comprobacion
module.exports.venderMonedas = venderMonedas
module.exports.actualPrecioCompra = obtenerNuevoPrecio
module.exports.actualizarEstadoVentas = actualizarEstadoVentas
module.exports.guardar = guardarNuevoEstado
module.exports.prepararVentas = prepararVentas