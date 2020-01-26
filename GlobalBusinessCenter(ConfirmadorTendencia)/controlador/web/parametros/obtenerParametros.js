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
				
				throw error
				
			}
			
		}else {
				
			if (autenticado === false){
					
				return res.jsonp({status:401,result:'Alguno de los datos introducidos no es valido'})
				
			}else {
				
				getParametros()
				
			}
		}
		
	})
	
	function getParametros(){
		
		parametrosModel.find(function(error,doc){
			
			if (error){return res.jsonp({status:500,result:'Algo salió mal'})}

			else {
				
				if (doc.length > 0){
					
					var arr = []
					
					for (var a=0;a<doc.length;a++){
						
						var m = {}
						m['intervalos'] = doc[a]['intervalos']
						m['minutos'] = doc[a]['minutos']
						
						arr.push(m)
						
					}
					
					return res.jsonp({status:200, result:arr})
					
				}else {
					
					return res.jsonp({status:200,result:'Aún no se han creado parametros'})
					
				}
			}
		})
	}
}