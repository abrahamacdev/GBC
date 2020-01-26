'use strict'

const parametrosModel = require('../../../modelo/Mongo/ParametrosModel.js')
const autenticar = require('../comprobaciones/autenticar.js')

const Utils = require('../../../Utils.js')
/*
 * 
 * Retornaremos los parametros en caso de que los halla
 * @param req
 * @param res
 * 
 */
module.exports = (req,res) => {
	
	autenticar(req.body.datos,function(error,autenticado){
		
		if (error) {
				
			if (error.status != undefined){
				
				return res.jsonp(error)
				
			}else {
				
				res.jsonp({status:500,result:'Algo salio mal'})
				
			}
			
		}else {
				
			if (autenticado === false){
					
				return res.jsonp({status:401,result:'Alguno de los datos introducidos no es valido'})
				
			}else {
				
				if (req.body.datos.intervalos != undefined && req.body.datos.minutos != undefined){
					
					crearParametros()
					
				}else {

					return res.jsonp({status:400, result:'Hay que enviar mas datos'})
			
				}
			}
		}
	})
	
	/*
	 * 
	 * Crearemos los parametros por primera vez
	 * 
	 */
	function crearParametros() {
		
		parametrosModel.find(function (err,documents){
			
			if (err) {
				
				res.jsonp({status:500,result:'Ha ocurrido un error'})
				
			}else {
				
				if (documents.length > 0){
					
					return res.jsonp({status:410,result:'Ya hay parametros creados, prueba modificandolos'})
					
				}else {
				
					if (req.body.datos.intervalos.length == 0){
			
						return res.jsonp({status:400,result:'Debes de enviar los intervalos deseados'})
					
					}else {
						
						if (req.body.datos.intervalos.length == req.body.datos.minutos.length){
							
							var args = []
						
							for (var i=0;i<req.body.datos.intervalos.length;i++){
								
								var m = {}
								m['intervalos'] = req.body.datos['intervalos'][i]
								m['minutos'] = req.body.datos['minutos'][i]
								
								args.push(m)
								
							}
							
							parametrosModel.insertMany(args,function(error,docs){
								
								if(error) {return res.jsonp({status:500,result:'Algo salio mal'})}
								
								else {
									
									return res.jsonp({status:201,result:'Se han creado los nuevos parametros'})
									
								}
							})
							
						}else {
							
							return res.jsonp({status:400, result:'Prueba enviando otra combinacion de minutos e intervalos'})
							
						}
					}
				}
			}
		})
	}
}