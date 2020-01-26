'use strict'

const porcentajesModel = require('../../modelo/Mongo/PorcentajesModel.js')
const parametrosModel = require('../../modelo/Mongo/ParametrosModel.js')
const Utils = require('../../Utils.js')
const async = require('async')


/*
 * 
 * Obtenemos los porcentajes de las monedas deseadas
 * @param req
 * @param res
 * 
 */
module.exports = (req,res) => {
	
	if (req.body != undefined && Object.keys(req.body).length > 0){
		
		if (req.body.monedas.length > 0 && req.body.intervalos.length > 0 && req.body.minutos.length > 0){
				
			comprobarIntervalos(req.body,function(intervalos){
				
				if (intervalos.length > 0){
					
					obtenerPorcentajes(req.body.monedas,intervalos,function(error,results){
						
						if (results != undefined){
							
							if (results.length > 0){
							
								calcMediaPorcentajes(results,function(porcentajes){
									
									console.log(porcentajes)
								
									return res.jsonp({status:200, result:porcentajes})
									
								})
							}
						}else {
							
							return res.jsonp({status:200, result:[]})
	
						}
					})
				}else {
					
					return res.jsonp({status:500,result:'Vuelve a intentarlo mas tarde'})
					
				}
			})
		}else {
			
			return res.jsonp({status:400, result:'Hacen falta más datos'})
			
		}
		
	}else {
		
		return res.jsonp({status:400, result:'Hay que enviar datos'})
	}
	 
	/*
	 * 
	 * Comprobamos que los periodos a obtener
	 * esten disponibles
	 * @param Map {} body
	 * @callback(intervalos)
	 * 
	 */
	function comprobarIntervalos (body,callback){
		
		parametrosModel.find(function(error,docs){
			
			if (error) {return res.jsonp({status:500, result:'Algo salió mal'})}
			
			else {
				
				var periodos = []
				
				// Comprobamos todos los periodos
				// que tenemos en la DB
				for (var a=0;a<docs.length;a++){
					
					var tmp = docs[a]['minutos'] / docs[a]['intervalos']
					
					for(var i=0;i<tmp;i++){
						
						var periodo = (i+1)*docs[a]['intervalos']
						
						if (!Utils.inArray(periodo,periodos)){
							
							periodos.push(periodo)	
							
						}
					}
				}
				
				var periodos_solicitados = []
				
				// Comprobamos todos los periodos
				// que estamos solicitando
				for (var a=0;a<body.minutos.length;a++){
					
					var tmp = body.minutos[a] / body.intervalos[a]
					
					for(var i=0;i<tmp;i++){
						
						var periodo = (i+1)*body.intervalos[a]
						
						if (!Utils.inArray(periodo,periodos_solicitados)){
							
							periodos_solicitados.push(periodo)	
							
						}
					}
				}
				
				
				periodos = periodos.sort(function(a, b){return a-b})
				periodos_solicitados = periodos_solicitados.sort(function(a, b){return a-b})
				
				var total = 0
				
				for(var i=0;i<periodos_solicitados.length;i++){
						
					if(!periodos.includes(periodos_solicitados[i])){
						
						return res.jsonp({status:400,result:'Prueba con otra combinacion de intervalos y minutos'})
						
					}
				}
	
				return callback(periodos_solicitados)
			}
		})
	}
	
	/*
	 * 
	 * Obtendremos los porcentajes de las monedas
	 * deseadas
	 * @param Array [] monedas
	 * @param Array [] intervalos
	 * @callback (porcentajes)
	 * 
	 */
	function obtenerPorcentajes (monedas,intervalos,callback) {
		
		var filtros = {}
		
		filtros['$or'] = []

		for (var a=0;a<monedas.length;a++){
				
			for (var i=0;i<intervalos.length;i++){
				
				// Añadimos cada una de las monedas buscadas
				filtros['$or'].push({moneda:monedas[a],intervalo:intervalos[i]})
				
			}
		}
		
		console.log(filtros)
		var query = porcentajesModel.find(filtros)
		query.sort({moneda:1, intervalo:1})
		
		query.exec(function(error,resultados){
			
			if (error) {return callback (error,null)}
			
			else {
				
				if (resultados.length > 0){
					
					return callback(null,resultados)
					
				}else {
					
					return callback(null,undefined)
					
				}
			}
		})
	}

	/*
	 * 
	 * Calculamos la media de los porcentajes 
	 * @param Array [] porcentajes
	 * @callback (media)
	 * 
	 */
	function calcMediaPorcentajes (porcentajes,callback){
		
		async.parallel([
		
			function(cb){
				
				console.log(porcentajes)
	
				var result_tmp = {}
				
				var monedas_filtrado = []
				
				var moneda_actual
				
				for (var a=0;a<porcentajes.length;a++){
					
					if (porcentajes[a]['moneda'] != moneda_actual){
						
						if (moneda_actual != undefined){
								
							result_tmp[moneda_actual] = monedas_filtrado
							monedas_filtrado = []
						}
						
						moneda_actual = porcentajes[a]['moneda']
							
					}	
						
					monedas_filtrado.push(porcentajes[a]['porcen'])
				}
				
				result_tmp[moneda_actual] = monedas_filtrado
				
				Object.keys(result_tmp).forEach(function(k){
					
					var suma = 0
					
					for (var i=0;i<result_tmp[k].length;i++){
						
						suma += result_tmp[k][i]
						
					}
					
					suma = (suma / result_tmp[k].length).toFixed(3)
					
					result_tmp[k] = suma
				})
				
				return cb(result_tmp)
			}
		],function(media){
			
			return callback(media)
			
		})
	}
}
