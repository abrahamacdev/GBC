'use strict'

const mongoose = require('mongoose')
const Config = require('../../Config.js')

var Schema = mongoose.Schema;
var tiempoPenalizacion = Config.tiempoPenalizacion

var penalizacionesSchema = mongoose.Schema({ 
		
	// Id del usuario
	idUsuario: {type:Number, required: true, index:true},
	
	// Moneda con penalizacion
	moneda: {type:String, required:true},
	
	// Tiempo hasta proxima eleccion
	ttl: {type: Date, default: undefined}
	
	
})

penalizacionesSchema.index({ "ttl": 1 }, { expireAfterSeconds: 0 });

//Definimos el esquema como modelo,para
//poder utilizalo en elº futuro
module.exports = mongoose.model ('Penalizaciones', penalizacionesSchema);