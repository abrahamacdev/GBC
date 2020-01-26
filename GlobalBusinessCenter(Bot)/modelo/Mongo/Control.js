'use strict'

const mongoose = require('mongoose')
const Config = require('../../Config.js')
var Schema = mongoose.Schema;

var controlSchema = mongoose.Schema({
	
	// Numero de usuarios alocados en este servidor
	allocatedUsers: {type:Number, index:true, min:-1, default:0}
	
})

//Definimos el esquema como modelo,para
//poder utilizalo en elº futuro
module.exports = mongoose.model ('Control', controlSchema);