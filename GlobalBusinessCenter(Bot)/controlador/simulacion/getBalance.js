'use strict'


const Config = require('../../Utils.js')

/**
 *
 * Simulamos la obtencion del balance disponible del usuario
 *
 * @þaram {Arry[]} (parametros) [Parametros de los usuarios]
 *
 * @callback (availableXUsuario)
 * 
 */

module.exports.simular = (parametros,callback) => {

	var results = []
	var count = 0

	Config.easyLoopAsync(parametros.length,function(i){

		count++

		results.push({'usuario':parametros[i]['falseId'],'available':parametros[i]['totalDisponible']})

		if (count == parametros.length){

			console.log('Balance simulado ', results)

			return callback(results)

		}
	})

}