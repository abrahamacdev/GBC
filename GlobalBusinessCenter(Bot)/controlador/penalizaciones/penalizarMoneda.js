'use strict'

const penalizacionesModel = require('../../modelo/Mongo/PenalizacionesModel.js')

/*
 * 
 * Penalizaremos una moneda antes de que se vuelva a
 * invertir en ella
 * @þaram String currency
 * 
 */
module.exports = (currency) => {
	
	console.log('Penalizamos '+ currency)
	
	var args = {
		
		moneda: currency
		
	}
	
	penalizacionesModel.create(args,function(error,inserted){
		
		if (error){
			
			if (error.code == 11000){}
			else {throw error}
		}
	})
}