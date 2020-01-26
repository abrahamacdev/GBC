'use strict'

const Config = require('../../Config.js')

const mongoose = require('mongoose')
const moment = require('moment')
var Schema = mongoose.Schema;

var velasSchema = mongoose.Schema({
	
	// Origen de los datos
	exchange: {type:String, required:true, enum:Config.exchanges},

    // Fecha de inserccion del registro
	fecha: {type:Number, required:true, index:true},

    // El nombre del mercado
    moneda: {type:String, required:true, index:true, default:undefined},
    
    // Primer valor de la vela
    O: {type:Number, required:true},

    // Valor mas alto que alcanzo la vela
    H: {type:Number, required:true},

    // Valor mas bajo que alcanzo la vela
    L: {type:Number, required:true},

    // Ultimo valor de la vela
    C: {type:Number, required:true},

    // Volumen comerciado (no BTC)
    V: {type:Number, required:true},

    // Hora de creacion de la vela
    T: {type:String, required:true},

    // Precio promedio por volumen ponderado
	BV: {type:Number, required:true},     
	
	// Fecha como referencia para TTL
	expireAt: { type: Date, index: {expireAfterSeconds: 0 }}
    
})
//Definimos el esquema como modelo,para
//poder utilizalo en elº futuro
module.exports = mongoose.model('Velas', velasSchema);
