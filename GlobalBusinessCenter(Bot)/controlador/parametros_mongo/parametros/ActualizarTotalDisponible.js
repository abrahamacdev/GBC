'use strict'

// MONGO
const parametrosModel = require('../../../modelo/Mongo/ParametrosModel.js')
const obtenerParametros = require('./ObtenerParametros.js')
 
// UTILS
const Config = require('../../../Config.js')
const Utils = require('../../../Utils.js')

/*
 * 
 * Actualizaremos el total aun disponible para invertir
 * 
 * @param Array [] datosUsuarios  [{usuario:usuario,cantidad:xxxx}]
 * @param Boolean suma
 * 
 * @param callback (actualizado)
 * 
 */
function actualizarDisponible (precio,suma,callback) {
	
	if (actualizandoDisponible == false){

			actualizandoDisponible = true // EVitamos que halla multiples instancias a la vez
		
			if(precio != null && suma != null){
		
			console.log('Vamos a actualizar el total disponible')
			console.log('Cantidad a operar ' + precio)
			
			obtenerParametros(function(error,parametros){
				
				if (error){return callback(false)}
				
				else {
					
					parametros = parametros[0]
					
					// Vamos a sumar al totalDisponible
					if (suma == true){
						
						console.log('Total disponible antes: ' + parametros['totalDisponible'])
						var nuevoTotalDisponible = parametros['totalDisponible']*1 + precio*1
						
						console.log('*************************')
						console.log('Total disponible despues: ' + nuevoTotalDisponible.toFixed(8))
						console.log('*************************')
						
						// Disponible fixed
						var nuevoTotalDisponibleFx = nuevoTotalDisponible.toFixed(8)
						
						// COmprobemos que no supere el totalAInvertir
						if (nuevoTotalDisponibleFx > parametros['totalAInvertir']){
							
							console.log('Es mayor que el total a invertir')
							parametros['totalDisponible'] = parametros['totalAInvertir']
							console.log(parametros['totalDisponible'])
							
						}else{
							
							parametros['totalDisponible'] = nuevoTotalDisponibleFx
							
						}
						
					// Vamos a restar al totalDisponible
					}else {
						
						console.log('Total disponible antes: ' + parametros['totalDisponible'])
						parametros['totalDisponible'] = parametros['totalDisponible'] - precio
						parametros['totalDisponible'] = parametros['totalDisponible'].toFixed(8)
						
						console.log('*************************')
						console.log('Total disponible despues: ' + parametros['totalDisponible'])
						console.log('*************************')
						
						if (parametros['totalDisponible'] < 0){
							
							console.log('<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<')
							console.log('Tenemos menos de 0 BTC disponibles')
							console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>')
							
							
						}
						
					}
				
					parametros.save(function(error){
						
						actualizandoDisponible = false // Dejamos la instancia libre
						
						if (error) {return callback (false)}
						else {
							
							return callback(true)
							
						}
					})
				}
			})
			
		}
	
	// Ya hay una instancia corriendo
	}else {
		
		setTimeout(function(){
			
			actualizarDisponible(precio,suma,callback)
			
		},1000)
	}
}

/**
 *
 * Actualizamos el total disponible de los usuarios en batch
 *
 * @param {Array[]} [usuarios] [#falseId del usuario y el monto a operar]
 * @param {String} [tipo] [Añadimos saldo o lo restamos ¿?]
 *
 * @callback (conError,actualizados) 
 * conError--> {Array[]} [Cada uno de los usuario a los que no se le han podido actualizar el disponible] 
 * actualizados--> {Array[]} [Usuarios a los que se le han actualizado el saldo correctamente]
 * 
 */
function enBatch (usuarios,tipo,callback) {

	var ids = [] // Id's de los usuarios a obtener
	
	var filtros = {}	
	filtros['$or'] = []

	var projection = {'totalDisponible':1,'falseId':1,'_id':1}

	for (let a=0;a<usuarios.length;a++){

		process.nextTick(function(){

			if(!Utils.inArray(usuarios[a]['id'],ids)){

				ids.push(usuarios[a]['id'])
				var m = {}
				m['falseId'] = usuarios[a]['id']
				filtros['$or'].push(m)

			}

			if (a == usuarios.length - 1){

				if (filtros['$or'].length > 0){

					obtenerParametros.conFiltros(filtros,projection,function(error,docs){

						if (error){return callback(undefined,undefined)}
						else {

							var iCount = 0

							for (let i=0;i<docs.length;i++){

								process.nextTick(function(){

									for (var e=0;e<usuarios.length;e++){

										if (usuarios[e]['id'] == docs[i]['falseId']){

											docs[i]['totalDisponible'] = (Utils.operators[tipo](docs[i]['totalDisponible']*1,usuarios[e]['monto']*1)).toFixed(10)
											
										}
									}

									iCount++

									if (iCount == docs.length){
										guardarSaldo(docs)

									}
								})
							}
						}
					})
				}
			}
		})
	}

	// Guardamos el saldo actualizado de
	// cada usuario
	function guardarSaldo (docs){

		var errores = [] // Usuarios que no han podido actualizar su saldo
		var actualizados = [] // Usuarios que han actualizado su saldo

		var count = 0

		for (let a=0;a<docs.length;a++){

			process.nextTick(function(){

				var updBy = {}
				updBy['_id'] = docs[a]['_id']

				var set = {}
				set['$set'] = {}
				set['$set']['totalDisponible'] = docs[a]['totalDisponible']

				parametrosModel.update(updBy,set,function(error,doc){

					count++

					if (error){

						console.log(error)

						errores.push(docs[a])
					}
					else {

						actualizados.push(docs[a])

					}
					if (count == docs.length){

						return callback(errores,actualizados)

					}
				})
			})
		}
	}
}

module.exports = actualizarDisponible
module.exports.enBatch = enBatch