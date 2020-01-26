'use strict'

const mongoose = require('mongoose')
const Config = require('../../Config.js')
var Schema = mongoose.Schema;
var states = ['running','pause','stopped']

// TODO Agregar los campos faltantes
var parametrosSchema = mongoose.Schema({
    
    // Correo del usuario
    userEmail : {type:String, required:true, unique:true, index: true, max:30},
	
	// Id para separar a los usuarios en rangos
	falseId: {type:Number, required:true, unique:true, index:true, min:-1},
    
    // Api Key del usuario
    apiKey: {type:String, required:false, unique:true, default: undefined, max:150},
    
    // Secret Key del usuario
    secretKey: {type:String, required:false, unique:true, default: undefined, max:150},
    
    // Controlamos el estado de la licencia
    tieneLicencia: {type:Boolean, required:false, default: false},
    
    // Porcentaje del capital total que se va a usar para cada inversion
    percXInvs: {type:Number, required:false, default: Config.valoresDefMongo.percXInvs, min: 0, max:100 },
    
    // Capital total que se usara para el bot
    totalAInvertir: {type:Number, required:true, min: 0},
    
    // totalXInvs = totalAInvertir * percXInvs (Total a invertir en cada inversion)
    totalXInvs: {type:Number, required: false, min: 0.000499999},
	
	// Cantidad disponible del #totalAInvertir
	totalDisponible: {type:Number, min: 0},
    
    // Porcentaje a superar en la recoleccion de precios
    percRecPri: {type:Number, required:false, default:Config.valoresDefMongo.percRecPri, min: -999, max: 999},
    
    // Estado del bot
    botState: {type:String, enum: states, default: 'running' },
 
    // Porcentaje del primer win (meta)
    percFirstTargWin: {type:Number, required:false, default:Config.valoresDefMongo.firstTargWin, min: 0, max:9999 },
    
    // Porcentaje del primer sl (meta)
    percFirstTargSL: {type:Number,required:false, default:Config.valoresDefMongo.firstTargSL, min: -9999, max:9999 }
    
})


//Definimos el esquema como modelo,para
//poder utilizalo en elº futuro
module.exports = mongoose.model ('Parametros', parametrosSchema);
