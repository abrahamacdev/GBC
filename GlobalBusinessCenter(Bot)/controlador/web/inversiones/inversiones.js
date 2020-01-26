'use strict'

const comprobarInversiones = require('../../controlador/analizador/comprobarInversiones.js')
var eliminarInversion = require('../../controlador/parametros_aerospike/EliminarInversion.js')
var obtenerInversion = require('../../controlador/parametros_aerospike/ObtenerInversion.js')

var aerosClient = null // Conexion a Aerospike

/*
 * 
 * Seteamos la conexion a Aerospike
 * @param Aerospike.Client conex
 * 
 */
function create (conex) {
	if (conex != null){
		aerosClient = conex
	}	
}

/*
 * 
 * Retornamos todas las inversiones activas
 * @param Request req
 * @param Response res
 * 
 */
function obtenerInversionesActivas (req,res) {
	
	comprobarInversiones.comprobarExistInvs(aerosClient,function(error,hayInversiones){
		
		if (error){
			
			res.jsonp({status:500,message:'Ha ocurrido un error'})
			res.end()
			
		}
		
		else {
			
			if (hayInversiones == true){
				
				comprobarInversiones.obtenerInvs(function(error,records){
					
					if (error){
						
						res.jsonp({status:500,message:'Ha ocurrido un error'})
						res.end()
							
					}else {
						
						res.jsonp({status:200,result: records['bins']})
						res.end()
						
					}
					
				})
				
			}else {
				
				res.jsonp({status:200,result:'No existe ninguna inversion analizandose en este momento'})
				res.end()
			}
		}		
	})	
}

/*
 * 
 * Retornamos todas las ventas activas
 * @param Request req
 * @param Response res
 * 
 */
function obtenerVentasActivas (req,res) {
	
	comprobarInversiones.comprobarExistVentas(aerosClient,function(error,hayVentas){
		
		if (error){
			res.jsonp({status:500,message:'Ha ocurrido un error'})
			res.end()
		}else {
			
			if (hayInversiones == true){
				
				comprobarInversiones.obtenerVentas(aerosClient,function(error,records){
					
					if (error){
						res.jsonp({status:500,message:'Ha ocurrido un error'})
						res.end()
					}else {
						res.jsonp({status:200,result: records['bins']})
						res.end()
					}					
				})
				
			}else {
				res.jsonp({status:200,result:'No existe ninguna inversion vendiendose en este momento'})
				res.end()
			}
		}
	})	
}

/*
 * 
 * Eliminamos todas las inversiones existentes
 * 
 */
function resetarInversiones (req,res){
	
	comprobarInversiones.comprobarExistInvs(aerosClient,function(error,hayInversiones){
		
		if (error){
			res.jsonp({status:500,message:'Ha ocurrido un error'})
			res.end()
		}
		
		else {
			
			if (hayInversiones == true){
				
				comprobarInversiones.obtenerInvs(function(error,records){
					
					if (error){
						res.jsonp({status:500,message:'Ha ocurrido un error'})
						res.end()
					}else {
						
						var recuento = 0 // Saber cuando hemos acabado 
						var err_ocurrido = false // Ha ocurrido algun error o no
		
						var resultado = {}
		
						for(var a=0;a<records.length;a++){
            				
							if (recuento === records.length - 1){
								
								if (err_ocurrido == true){
									
									resultado['status'] = 500
									resultado['message'] = 'Ha ocurrido un error'
									
								}else {
									
									resultado['status'] = 200
									resultado['result'] = 'Se han eliminado correctamente todas las inversiones (ventas activas incluidas)'
									
								}
								
								res.jsonp(resultado)
								res.end()
								
							}
							
							var filtros = {
							
								orderIdCompra: records[a]['bins']['orderIdCompra']
							
							}
								
							obtenerInversion.buscarConFiltros(filtros,null,aerosClient,function(error,buscada){
								
								recuento++
								
								if (error){err_ocurrido = true}
								
								else {
						
									for(var i=0;i<buscada.length;i++){
										
										eliminarInversion.eliminarConKey(buscada[i]['key'],client,function(error,isDeleted){
									
											if (error){err_ocurrido = true}
											
										})  
									}
								}
							})
						}
					}
				})
				
			}else {
				res.jsonp({status:200,result:'No existe ninguna inversion en este momento'})
				res.end()
			}
		}		
	})
}

module.export = create
module.export.obtenerInversiones = obtenerInversiones
module.export.obtenerVentasActivas = obtenerVentasActivas
module.export.resetearInversiones = resetearInversiones