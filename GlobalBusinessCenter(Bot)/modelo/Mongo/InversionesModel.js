const mongoose = require('mongoose')
const Config = require('../../Config.js')
var Schema = mongoose.Schema;

var inversionesSchema = mongoose.Schema({
    
	// Moneda que ha comprado el usuario
    moneda: {type:String, index:true},

	// Precio de compra de la moneda
	precioCompra: {type:Number},

	// Precio de venta de la moneda (se va actualizando)
	precioVenta: {type:Number},
	
	// Proxima meta antes de subir los parametros
	metaW: {type:Number},
	
	// Proxima meta antes de vender la moneda
	metaSL: {type:Number},
	
	// Id numerico correspondiente al usuario
	IdUsuario: {type:Number, index:true},
	
	// % del precio a batir (metaW pero en %) 
	lastPercW: {type:Number},
	
	// % del precio a batir antes de vender (metaSL pero en %) 
	lastPercSL: {type:Number},
	
	// Cantidad de monedas compradas
	cantidad: {type:Number},
	
	// Id de la venta
	IdVenta: {type:String, unique:true, sparse:true},
	
	// Id de la compra
	IdCompra: {type:String, unique:true, sparse:true},
	
	// Id post compra (es el id de compra)
	IdAnalizar:{type: String, unique:true, sparse:true},
	
})

//Definimos el esquema como modelo,para
//poder utilizalo en elº futuro
module.exports = mongoose.model ('Inversiones', inversionesSchema);