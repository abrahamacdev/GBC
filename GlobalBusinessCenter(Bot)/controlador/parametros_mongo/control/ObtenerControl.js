'use strict'

const controlModel = require('../../../modelo/Mongo/Control.js')

/*
 * 
 * Obtenemos los valores de ControlModel
 * @callback(error,control)
 * 
 */
module.exports = function(callback) {

    controlModel.find(function(error,datos){

		if(error) {return callback(error,null)}
		
		else {

			if (datos.length == 0){
				
				controlModel.create({},function(err,doc){
					
					if (err) {return callback(err,null)}
					
					else {
						
						return callback(null,doc)
						
					}
				})
			}else {
				
				return callback(null,datos[0]) //Dato de control
				
			}
		}
    })
}