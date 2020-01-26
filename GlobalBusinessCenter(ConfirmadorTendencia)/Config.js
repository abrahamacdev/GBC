'use strict'

// UTILIDADES
const Utils = require('./Utils.js')

var config = {
	valoresWorkers: {
		n_workers : 2,
		trabajoWeb : 1,
		trabajoAnalizar : 0
	},
	tickRate: 60, // 1min
	candleForStrategies: 60, //1800, // 30min
	summariesForStrategies: 60, // 5 min
	estrategias: {

		porcCambio: Utils.dirs.recolectorEstrategias + 'porcCambio.js'
	
	},
	exchanges: ['bittrex'],
	dataTypes: {

		summaries: 1,
		candles: 2 

	},
	expireCandles: 43200, // 12h
	expirePrices: 43200, // 12h
}

module.exports = config
