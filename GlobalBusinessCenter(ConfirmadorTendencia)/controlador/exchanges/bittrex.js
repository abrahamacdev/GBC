'use strict'

// MODULOS EXTERNOS
const _ = require('lodash')
const btx = require('node-bittrex-api')
const moment = require('moment')
const asyncLoop = require('node-async-loop')

// UTILIDADES
const Utils = require('../../Utils.js')
const Config = require(Utils.dirs().CT + 'Config.js')

const EXCHANGE_NAME = 'bittrex'

const base_url = 'https://bittrex.com/Api/v2.0'
const lastest_ticks = '/pub/market/GetLatestTick?'
const default_tick_interval = 'fiveMin' //'thirtyMin'  

var reg = new RegExp('^BTC')

var tries = 0
var cTries = 0

var candle_tick_required = Config.candleForStrategies //segundos
var summaries_tick_required = Config.summariesForStrategies // segundos

var summaries_tick = 0 // Nos servira para conocer cuando tenemos que recoger summaries
var candles_tick = 0  // Nos servira para conocer cuando tenemos que recoger candles

var recojoVelas = false // Nos indica si recoger velas
var recojoPrecios = false // Nos indica si recoger summaries

var primeraVez = true

var bittrex = {

	launch: function (cb){

		if (primeraVez == true){
			primeraVez = false
		}else {
			summaries_tick += Config.tickRate
			candles_tick += Config.tickRate
		}

		console.log('candles tick', candles_tick)
		console.log('summaries tick', summaries_tick)

		// Velas cada 30 min 
		if (candles_tick == candle_tick_required){

			recojoVelas = true
			candles_tick = 0
		}

		// Summaries cada 5 min
		if (summaries_tick == summaries_tick_required){

			recojoPrecios = true
			summaries_tick = 0
		}


		if (recojoVelas == true || recojoPrecios == true){

			recojoPrecios = false

			var metadata = {}
			metadata['horaPeticion'] = moment().unix()
			metadata['exchange'] = EXCHANGE_NAME

			bittrex.getBTCMarketPrices(function(error,markets){

				// Comprobamos si los datos son candles o summaries
				if ('Last' in markets[0]){

					metadata['dataType'] = Config.dataTypes.summaries
				}
				else {

					metadata['dataType'] = Config.dataTypes.candles}

				cb(error,markets,metadata)			
			})			
		}	
	},
	getBTCMarketPrices: function (cb){

		tries++
		bittrex.getMarketSummeries(function(error,data){
	  		
	  		var markets = []

	  		if (error){throw error}

	  		else {

	  			if (data.length == 0){
					if (tries == 3){

						tries = 0
						return cb(error,markets)
					}
					else {

						bittrex.getBTCMarketPrices(cb)
					}
				}
				else {
					asyncLoop(data,function(currency,next){
						if (currency.MarketName.match(reg)){
			            
			            	markets.push(currency)
			        	}
			        	next()
					},function(){

						tries = 0

						var monedas = []

						for (let c=0;c<markets.length;c++){

							monedas.push(markets[c]['MarketName'])

						}

						cb(undefined,markets)

						if (recojoVelas == true){

							recojoVelas = false

							bittrex.getCandles(monedas,function(withErrors,candles){

								return cb(withErrors,candles)
							})
						}
					})
				}    
	  		}  	
	    })
	},
	getMarketSummeries: function (cb){

		btx.getmarketsummaries(function(data,error){ 	
	        if (error){return cb(error,undefined)}
	        else {
	        	
        		return cb(undefined,data['result'])	
			}
		})
	},
	getCandles: function (markets,cb){

		var errores = 0
		var withError = []
		var count = 0
		var candles = []

		for(let i=0;i<markets.length;i++){

			bittrex.getCandle(markets[i],Config.candleForStrategies,function(error,candle){

				count++

				if (error){

					console.log(error)
					withError.push(error)
				}else {

					candles.push(candle)
				}

				if (count == markets.length){

					cTries++

					cb(undefined,candles) // Procesamos las que ya tenemos

					if (withError.length > 0){

						if (cTries < 4){

							bittrex.getCandles(withError,cb) // Reintentamos las que nos han dado fallos

						}else {

							cb(withError,undefined)

						}
					}
				}
			})
		}
	},
	getCandle: function(market,interval,cb){

		var marketName = 'marketName=' + market
		var tickInterval = '&tickInterval=' + default_tick_interval
		var time = '&_=' + moment().unix()

		var url = base_url + lastest_ticks + marketName + tickInterval + time

		btx.sendCustomRequest(url, function(data, err) {
			
			if (err){

				return cb(market,undefined)
			}
			else  {

				var response = {}
				response['MarketName'] = market
				response['Candle'] = data['result'][0]

				return cb(undefined,response)
			}
		})
	}
}

module.exports = bittrex