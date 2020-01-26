'use strict'

const bcrypt = require('bcrypt');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode')

const perfilModel = require('../../../modelo/Mongo/PerfilModel.js')
const securityModel = require('../../../modelo/Mongo/SecurityModel.js')

const Config = require('../../../Config.js')
const Utils = require('../../../Utils.js')

var twofactor = {}

module.exports = (req,res) => {
		
	// Hay datos para guardar
	if (req.body.datos != undefined){ 
		
		crearPerfil(req.body.datos)
		
	}else {
		
		return res.jsonp({status:400, result:'No hay suficientes datos para crear el usuario'})
		
	}
	
	
	
	/*
	 * 
	 * Creamos el nuevo perfil
	 * @param Map {} datos
	 * @callback(error,created)
	 * 
	 */
	function crearPerfil (datos) {
		
		var args = {
			user: datos.usuario
		}
		
		var secret = speakeasy.generateSecret({length: 12, name: 'Confirmador de tendencia ' + '(' + datos.usuario + ')'});
		
		perfilModel.find(function(er,doc){
			
			if (er){
				
				return res.jsonp({status:500,result:'Algo salió mal'})
				
			}else {
				
				// Ya hemos llegado al limite disponible
				if (doc.length === 3){
					
					return res.jsonp({status:500,result:'Limite alcanzado'})
					
				// Necesitamos la ayuda de las otras 2 cuentas
				}else if (doc.length == 1 || doc.length == 2){
					
					var targets = []
					for(var a=0;a<doc.length;a++){
					
						targets.push(doc[a]['user'])
						
					}
					
					if (datos.ayudaCreacion == undefined){
						
						return res.jsonp({
							
							status:400,
							result:'Necesitas la ayuda de los demas administradores para crear tu perfil'
							
						})
						
					}else {
						
						
						// Comprobamos que se hallan enviado los codigos
						// de todos los admins existentes
						Utils.inMap(targets,datos.ayudaCreacion,function(isIn){
							
							if(isIn.length == doc.length){
								
								console.log(doc)
								
								var verificado = false
								
								// Obtenemos el secret de todos los
								// admins y lo verificamos
								for(var i=0;i<doc.length;i++){
									
									var user = doc[i]['user']
									
									var verified = speakeasy.totp.verify({
										secret: doc[i]['token2fa'], // Secret que tenemos en la BD
										encoding: 'base32',
										token: datos['ayudaCreacion'][user] // Numero de Google2FA
									})
									
									if (verified){verificado = true}
									else {verificado = false}
									
								}
								
								if (verificado == true){
									
									generarContraseñas(datos,secret,args)
									
								}else {
									return res.jsonp({
										status:400,
										result:'Alguno de los codigos era incorrecto'
									})
								}
								
							}else {
								return res.jsonp({
									status:400,
									result:'Falta algun administrador o alguno de los introducidos no es válido'
								})
							}
						})
					}
					
				
				// Es la primera cuenta que creamos
				}else{
					
					console.log('No hay ninguna cuenta, podemos crearla solos')
					generarContraseñas(datos,secret,args)
					
				}
			}
		})
	}
	
	/*
	 * 
	 * Generamos las contraseñas
	 * 
	 */
	function generarContraseñas (datos, secret, args) {
		
		var BCRYPT_SALT_ROUNDS = 15;
		
		QRCode.toDataURL(secret.otpauth_url, function(error, data_url){
			
			if (error){
				
				res.jsonp({status:500,result:'Algo salió mal'})
				throw error
				
				
			}else {
				
				twofactor = {
					secret: "",
					tempSecret: secret.base32,
					dataURL: data_url,
					otpURL: secret.otpauth_url
				};
			}
			
			// Generamos el salt
			bcrypt.genSalt(BCRYPT_SALT_ROUNDS, function(err,salt){
				
				if (err) {
					
					res.jsonp({status:500,result:'Algo salió mal'})
					throw (err)
					
				}else {
					
					// Generamos el hash con la contraseña y el salt
					bcrypt.hash(datos.password, salt, function(er,hash){
						
						if (er) {
							
							res.jsonp({status:500,result:'Algo salió mal'})
							throw (er)
						
						}else {
							
							args['password'] = hash
							
							if (Object.keys(twofactor).length > 0){
								args['token2fa'] = twofactor['tempSecret']
								var url = twofactor['dataURL']
							} 
							
							guardarDatos(args,salt,url)
		
						}
							
					})
				}
			})
		})
	}

	
	/*
	 * 
	 * Guardamos los datos del nuevo perfil
	 * 
	 */
	function guardarDatos (args,sal,url) {
		
		// Creamos el usuario en PerfilModel.js
		perfilModel.create(args,function(error,doc){

			if (error) {
				
				res.jsonp({status:500,result:'Algo salió mal'})
				throw error
			
			}else {
				
				var security = {
					user: args['user'],
					salt: sal
				}
				
				// Guardamos el salt con el nombre de usuario asociado
				securityModel.create(security,function(err,dc){
					
					if (err){
							
						res.jsonp({status:500,result:'Algo salió mal'})
						throw err
						
					}else {
						
						return res.jsonp({
							status:201,
							result:'Se ha creado el perfil correctamente, tienes ' + Config.caducidad + ' minuto/s para verificar G2FA',
							g2faUrl: url})
						
					}
				})
			}
		})
	}

}