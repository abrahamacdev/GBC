'use strict'

// ANALIZADOR
const getBitcoinPrices = require('../peticion/getBitcoinPrices.js')

// UTILIDADES
const Utils = require('../../Utils.js')

const max = 100 


/*
 * 
 * Obtenemos los precios que superen el menor 
 * #percRecPri seteado por un usuario
 * 
 * @param Number percRecPri
 * 
 * @callback (valores)
 * 
 */
function seleccionarValores(percRecPri,callback){
	
	getMonedasOrdenadas(function(error,monedasOrdenadas){

		if (error) {return callback([])}
		
		else {

			comprobarSuperaPer(monedasOrdenadas,percRecPri,function(superanPer){
				

				return callback(superanPer)
				
			})
		}
	})
}

/*
 * 
 * Obtenemos todas las monedas y las ordenamos
 * @callback (monedasOrdenadas)
 * 
 */
function getMonedasOrdenadas (callback){
	
	getBitcoinPrices(function(err, monedas) {
		
		if (err) {return callback(err,null)}
		
		else {
			
			if (monedas.length > 0){
				
				var valores = []
				
				for (var a=0;a<monedas.length;a++){
					
					var moneda = {}
					moneda['marketName'] = monedas[a]['MarketName']
					moneda['marketPercent'] = calculatePer(monedas[a]['PrevDay'],monedas[a]['Last'])
					valores.push(moneda)
				}
				
				ordenarPrecios(valores,function(ordenados){

					if (ordenados.length > 0){
						
						return callback(null,ordenados)
						
					}else {return callback([])}
				})
			}
			
			else {return callback([])}
		}
	})
}

/*
* 
* Ordenamos los precios para saber cuales son las mejores
* @param Array [] valores
* @return callback (ordenados) {array[[Moneda,% cambio],[Moneda2,% cambio 2]]}
* 
*/
function ordenarPrecios(valores,callback){
	
	if (valores.length > 0){
		
		var items = Object.keys(valores).map(function(k) {
			return [valores[k]['marketName'], valores[k]['marketPercent']];
		});
		
		// Ordenamos el array por el segundo elemento
		items.sort(function(first, second) {
			
			return second[1] - first[1];
		});
		
		return callback(items)
	
	}
}

/*
* 
* Calculamos el porcentaje del precio para saber si 
* compramos la moneda o no.
* @param number 
* @param number
* @return number
* 
*/
function calculatePer(prevDay,last){

	return (last*max/prevDay).toFixed(3)	
}

/*
 * 
 * Comprobamos que las monedas superen el porcentaje
 * necesitado
 * @param Array [] monedasOrdenadas
 * @param Number percRecPri
 * @param callback(superanPer)
 * 
 */
function comprobarSuperaPer(monedasOrdenadas,percRecPri,callback){
	
	percRecPri = percRecPri + max

	for (var a=0;a<monedasOrdenadas.length;a++){
		
		if (monedasOrdenadas[a][1] < percRecPri){
		
			monedasOrdenadas.splice(a)
			
		}
	}
	
	if (monedasOrdenadas.length > 0){
		
		return callback (monedasOrdenadas)
		
	}else {
		
		return callback([])
		
	}
}

module.exports = seleccionarValores 


