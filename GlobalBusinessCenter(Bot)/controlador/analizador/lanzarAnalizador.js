'use strict'

// MODULOS EXTERNOS
const mongoose = require('mongoose')
const parametrosModel = require('../../modelo/Mongo/ParametrosModel.js')
const dotenv = require('dotenv').config()


// MONGO 
const obtenerParametros = require('../parametros_mongo/parametros/ObtenerParametros.js')
const actualizarParametros = require('../parametros_mongo/parametros/ActualizarParametros.js')
const conectarDB = require('../../modelo/Mongo/MongoDB.js')

// UTILS
const contador = require('../contador/contador.js')
const rango = require('../workers/rango.js')
const Config = require('../../Config.js')

// BOT
const preInversion = require('../inversion/preInversion.js')
const seguimientoVentas = require ('../seguimiento/seguimientoVenta.js')
const seguimientoCompras = require('../seguimiento/seguimientoCompra.js')

	

/*
 * 
 * Lanzamos el bot
 * 
 */
function lanzarBot (){

	console.log('Rango asignado ' + (rango.getRango()[0] + 1) + ' -' ,(rango.getRango()[1] - 1), ' ', process.pid)

	conectarDB.conectarMongo(function(){
		
		contador() // Actualizacion constante del CAV
			
	})	
}

module.exports = lanzarBot