'use strict'

const speakeasy = require('speakeasy');
const bcrypt = require('bcrypt')

const PerfilModel = require('../../../modelo/Mongo/PerfilModel.js')
const SecurityModel = require('../../../modelo/Mongo/SecurityModel.js')

const comprobarCaducidad = require('./comprobarCaducidad.js')

const Utils = require ('../../../Utils.js')

/*
 * 
 * Autenticamos a la persona antes de concederle permisos
 * @param Map {} datos
 * @callback (error,autenticado)
 * 
 */
module.exports = (datos,callback) => {
	
	if (datos != undefined){
		
		if (datos.usuario != undefined && datos.password != undefined && datos.token != undefined){
			
			autenticar(datos,function (error,autenticado){
						
				if (error) {
					if (error.status == undefined){
						throw error
					}else {
						
						return callback(null,false)
						
					}
				}
				
				else {
					
					if (autenticado === true){
						
						return callback (null,true)
						
					}else {
						
						return callback (null,false)
						
					}
				}
			})
			
		}else {
			
		return callback({status:400,result:'Hay que enviar datos para realizar esta operacion'},false)
			
		}
		
	}else {
		
		return callback({status:400,result:'Hay que enviar datos para realizar esta operacion'},false)
		
	}
}

/*
 * 
 * Realizamos todas las comprobaciones
 * @param Map {} datos
 * @callback (error,autenticado)
 * 
 */
function autenticar (datos,callback) {
	
	var necesario = ['usuario','password','token']
	
	Utils.inMap(necesario,datos,function(isIn){
		
		if (isIn.length != necesario.length){
		
			return callback ({status:400,result:'Faltan datos para la validacion'},false)
			
		}else {
		
			comprobarCaducidad(datos['usuario'],function(error,caducado,activado){
			
				if (error) {
				
					throw error
				
				}else if (activado != null){
						
					if (activado === true){
						
						coincidenPasswords(datos,function(err,coinciden){
						
							if (err) {throw err}
							
							else {
								
								if (coinciden === true){return callback(null,true)}
								else  {
									
									return callback(null,false)
									
								}
							}
						})
						
					}else {
	
						return callback({status:400,result:'No existe el usuario o aun no se ha realizado la activacion'},false)
				
					}
				}
			})
		}
	})	
}

/*
 * 
 * Comprobamos que las contraseñas coincidan
 * @param Map{} datos
 * @callback (error,coinciden)
 * 
 */
function coincidenPasswords (datos,callback){
	
	SecurityModel.find({user: datos['usuario']},function(error,doc){
		
		if (error){return callback (error,false)}
		
		else {
			
			if (doc.length > 0){
				
				doc = doc[0]
				
				var salt = doc['salt']
								
				// Generamos el hash con la contraseña y el salt
				bcrypt.hash(datos['password'], salt, function(err,hash){
					
					if (err) {
						
						return callback(err,false)}
					
					else {
						
						
						verificacionDeDatos(hash,datos['usuario'],datos['token'],function (er,verificado){
							
							if (er){return callback(er,false)}
							
							else {
							
								return callback(null,verificado)
	
							}
						})
					}
				})
			}
		}
	})
}

/*
 * 
 * Verificamos que la contraseña sea la enviada y
 * el token 2FA tambien
 * @param String hash
 * @param String usuario
 * @param Number token
 * @callback (error,verificado)
 * 
 */
function verificacionDeDatos (hash,usuario,token,callback){
	
	PerfilModel.find({password: hash,user: usuario},function(error,document){
							
		if (error){return callback(error,false)}
		
		else {
			
			if (document.length > 0){
				
				var verified = speakeasy.totp.verify({
					
					secret: document[0]['token2fa'],
					encoding: 'base32',
					token: token
						
				})
				
				if (verified){
					
					return callback (null,true)
					
				}else {
					
					return callback(null,false)
					
				}
				
			}else {
					
				return callback (null,false)
				
			}
		}
	})
}