'use strict'

const express = require('express')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')		
const methodOverride = require("method-override")	

const parametrosModel = require('../../modelo/Mongo/ParametrosModel.js') 
const conectarDB = require('../../modelo/conectarDB.js')

const parametros = require('./parametros/parametros.js')
const inversiones = require('./inversiones/inversiones.js') 

const Config = require('../Config.js')

var aerosClient = null // Conexion a Aerospike

module.exports = () => {
    
	/*// Nos aseguramos de estar conectados a las DB's
	if (aerosClient == null){
		
		conectarDB(function (conex){
			
			if (conex != null){
				
				aerosClient = conex
				inversiones(aerosClient)
				
			}			
		})		
	}else {inversiones(aerosClient)}
	
	// Creamos una instancia de express()
	var app = express()
	
	// Middlewares
	app.use(bodyParser.urlencoded({ extended: true }))
	app.use(bodyParser.json())
	app.use(methodOverride())
	app.set("jsonp callback", true)
	
	
	// API routes
	var api = express.Router()
	
	api.put('/modificarParametros',parametros.modificar) // Modificar parametros de Mongo
	
	api.get('/inversionesActivas',inversiones.obtenerInversionesActivas) // Inversiones analizandose
	api.get('/ventasActivas', inversiones.obtenerVentasActivas) // Inversiones en estado de venta
	
	api.get('/resetearInversiones', inversiones.resetarInversiones) // Borramos todas las inversiones
	
	// Ruta base /botcaja
	app.use('/botcaja', api);
	module.export = app
	
	// Iniciamos el servidor
	app.listen(process.env.WebPort, function(){
		
		// TODO Eliminar en produccion
		console.log('Servidor corriendo en http://localhost:' + process.env.WebPort)
		
	})*/
	
}