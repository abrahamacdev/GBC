'use strict'

// MODULOS EXTERNOS
const bittrex = require('node-bittrex-api')

// UTILIDADES
const Utils = require('../../Utils.js')

const reg = new RegExp("^BTC") // Las monedas que solo queremos recoger

/**
 *
 * Obtenemos los precios de bittrex
 *
 * @callback (error,precios)
 * error--> Error de la peticion
 * precios--> Array[] (Array de monedas con todos los datos de la moneda)
 * 
 */
module.exports = (callback) => {

	bittrex.getmarketsummaries(function(data, err) {
        
        if (err) {return callback(err,undefined)}
        
        else { 

        	if (data['result'].length > 0){
                            
                var aCount = 0

                for (let a=data['result'].length - 1; a>=0 ;a--){
                    
                    process.nextTick(function(){

                        if (!data['result'][a]['MarketName'].match(reg)){

                            data['result'].splice(a)
                        }

                        aCount++

                        if (aCount == data['result'].length){

                            return callback(undefined,data['result'])

                        }
                    })
                }
            }else {

                return callback(undefined,[])

            }
        }
    })
}