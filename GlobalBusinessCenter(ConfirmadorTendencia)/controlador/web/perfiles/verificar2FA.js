'use strict'

const speakeasy = require('speakeasy');

const PerfilModel = require('../../../modelo/Mongo/PerfilModel.js')
const SecurityModel = require('../../../modelo/Mongo/SecurityModel.js')

const eliminarPerfil = require('./eliminarPerfil.js')
const comprobarCaducidad = require('../comprobaciones/comprobarCaducidad.js')

module.exports = (req,res) => {
	
	if (req.body != undefined && Object.keys(req.body).length > 0){
		
		// Hay datos para guardar
		if (req.body.datos != undefined){ 
			
			// Comprobamos si ha caducado el tiempo para verificar
			comprobarCaducidad(req.body.datos.usuario,function(err,caducado,activado){
				
				if (err) {
					
					res.jsonp({status:500,result:'Algo salio mal'})
					
					throw err
				}
				
				else {
					
					if (caducado == true){
						
						eliminarPerfil(req.body.datos.usuario,function(er,deleted){
						
							if (er) {
								
								res.jsonp({status:500,result:'Algo salio mal'})
								throw err
		
							}
							
							else {
								
								if (caducado == true){return res.jsonp({status:403,result:'Ha terminado el tiempo para verificar la cuenta'})}
								
							}								
						})
					}else if (activado == true) {
						
						return res.jsonp({status:400,result:'Ya esta activado'})
						
					}else{
						
						verificarPerfil2FA(req.body.datos,function(error,data){
						
							if (error) {
								
								res.jsonp({status:500,result:'Algo salio mal'})
								throw error
								
							}
							
							else {
							
								if (data.status == 200){
									
									return res.jsonp({status:200,result:'Se ha configurado 2FA correctamente'})
								
								}else {
									
									return res.jsonp({status:500,result:'No se ha podido activar 2FA'})
									
								}
							}
						})
					}
				}
			})
		}else {

			return res.jsonp({status:400, result:'No hay suficientes datos para crear el usuario 2FA'})

		}
		
	}else {
		
		return res.jsonp({status:400, result:'Hay que enviar datos para crear el perfil 2FA'})
	}
}


/*
 * 
 * Creamos el perfil 2FA 
 * @param Map {} datos
 * @callback (error,created)
 * 
 */
function verificarPerfil2FA(datos,callback){
	
	PerfilModel.find({user:datos['usuario']},function(error,doc){
		
		if (error){return callback (error,null)}
		
		else {
			
			var verified = speakeasy.totp.verify({
				secret: doc[0]['token2fa'], // Secret que tenemos en la BD
				encoding: 'base32',
				token: datos['token'] // Numero de Google2FA
			})
			
			if (verified){
					
				doc[0]['faActivated'] = true
				
				// Ya tenemos activado 2FA
				doc[0].save(function(err,doc){
					
					if (err){return callback (err,null)}
					
					else {
						
						return callback(null,{status:200})
						
					}
				})
			}else {
				
				return callback(null,{status:500})
				
			}
		}
	})
}