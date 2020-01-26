'use strict'

const Config = require('../../Config.js')

var rango = undefined // Rango de usuarios que tendra el nucleo ([0]-> Inicio, [1]-> Final)

/*
 * 
 * Seteamos el rango asigando al proceso actual
 * @Number range 
 * 
 */
module.exports.setRango = (range) => {
					
				// $gt - $lt
	// Actualmente ([0/99],[100/200],[200/300])
	rango = []
	rango.push((range-1)-Config.valoresWorkers.xNucleo) // (gt than 1º-1)
	rango.push(range)									// (lt than x)
	
}

/*
 * 
 * Obtenemos el rango asignado al proceso actual
 * @return rango
 * 
 */
module.exports.getRango = () => {
	
	return rango
	
}