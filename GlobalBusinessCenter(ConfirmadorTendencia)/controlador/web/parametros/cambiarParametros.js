'use strict'

const ParametrosModel = require('../../../modelo/Mongo/ParametrosModel.js')

const autenticar = require('../comprobaciones/autenticar.js')
const Utils = require('../../../Utils.js')
 

/*
 * 
 * Cambiaremos los parametros que se utilizaran para calcular
 * los porcentajes
 * 
 */
module.exports = (req,res) => {

	autenticar(req.body.datos,function(error,autenticado){
		
		if (error) {
			
			res.jsonp({status:500,result:'Algo salio mal'})
			
			throw error
			
		}else {
			
			if (autenticado === true){
				
				cambiarPorcentajes()
				
			}else {
				
				return res.jsonp({status:401,result:'Alguno de los datos introducidos no es valido'})
				
			}
		}
	})
	
	/*
	 * 
	 * Cambiamos los parametros 
	 * 
	 */
	function cambiarPorcentajes (){
		
		var datos = req.body.datos
		
		var necesario = ['intervalos','minutos']
		
		Utils.inMap(necesario,datos,function(isIn){
			
			if (isIn.length > 1){
				
				if (datos['intervalos'].length == datos['minutos'].length){
					
					ParametrosModel.remove({},function(error,doc){
						
						if (error){return res.jsonp({status:500,result:'Algo salió mal'})}
						
						else {
							
							console.log(doc['result'])
							
							if (doc['result']['ok'] == 0){
								
								return res.jsonp({status:400,result:'No se han podido actualizar los parametros porque no existian'})
								
							}else {
								
								var args = []
							
								for (var a=0;a<datos['intervalos'].length;a++){
									
									var m = {}
									m['intervalos'] = datos['intervalos'][a]
									m['minutos'] = datos['minutos'][a]
									
									args.push(m)
									
								}
								
								ParametrosModel.create(args,function(err,docs){
									
									if (err) {return res.jsonp({status:500,result:'Algo salio mal'})}
									
									else {
										
										return res.jsonp({status:201, result:'Se han actualizado los parametros correctamente'})
										
									}
								})
							}
						}
					})
					
				}else {
				
					return res.jsonp({status:400,result:'Prueba enviando otra combinacion de minutos e intervalos'})
					
				}
				
			}else {
				return callback({status:400,result:'Hacen falta mas datos para actualizar los parametros'},false)
			}
		})	
	}
}

