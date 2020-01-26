'use strict'

const mongoose = require('mongoose')
const moment = require('moment')
var Schema = mongoose.Schema;

var fiSchema = mongoose.Schema({
	
	// Nombre del mercado
	moneda: {type: String, required: true, index: true},

	// Valor del force index
	value: {type: Number, required: true},	

	// A que hora insertamos el documento 
	createAt: {type: Number, required: true, default: Date.now(), index: true},
	
	// Fecha como referencia para TTL
	expireAt: { type: Date, index: {expireAfterSeconds: 0 }}
    
})
//Definimos el esquema como modelo,para
//poder utilizalo en elº futuro
module.exports = mongoose.model('FI', fiSchema);
