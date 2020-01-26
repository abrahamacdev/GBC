'use strict'

const Config = require('../../Config.js')

const mongoose = require('mongoose')
const moment = require('moment')
var Schema = mongoose.Schema;

var preciosSchema = mongoose.Schema({
    
	// Origen de los datos
	exchange: {type:String, required:true, enum:Config.exchanges},

    // El nombre del exchange
    moneda: {type:String, required:true, index:true, default:undefined},
    
    // Precio de la moneda
    precio: {type:String, required:true, default:undefined},
    
    // Fecha de recogida
    fecha: {type:Number, required:true, index:true},
	
	// Fecha como referencia para TTL
	expireAt: { type: Date, default:undefined, index: {expireAfterSeconds: 0 }}
    
})

//Definimos el esquema como modelo,para
//poder utilizalo en elº futuro
module.exports = mongoose.model('Precios', preciosSchema);
