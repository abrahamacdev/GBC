'use strict'

// MODULOS EXTERNOS
const bittrex = require('node-bittrex-api')

// UTILIDADES
const Utils = require('../../Utils.js')
const Config = require('../../Config.js')
const Rango = require('../workers/rango.js')

// MONGO
const obtenerParametros = require('../parametros_mongo/parametros/ObtenerParametros.js')
const obtenerInversiones = require('../parametros_mongo/inversiones/ObtenerInversiones.js')
const actualizarInversiones = require('../parametros_mongo/inversiones/ActualizarInversiones.js')

// ANALIZADOR
const penalizar = require('../penalizaciones/penalizarMoneda.js')
const seguimientoVenta = require('../seguimiento/seguimientoVenta.js')
const getBitcoinPrices = require('../peticion/getBitcoinPrices.js')

// PRE-ANALISIS ------------------

/**
 *
 * Comenzamos a analizar las inversiones que tenemos 
 * 
 */
function lanzarAnalisis () {
    
    obtenerPreciosBittrex(function(error,monedas){

        if (error){console.log(error)}
        else {

            console.log('Vamos a comparar los valores')
            compararValores(monedas)

        }
    })
}

/**
 *
 * Obtenemos los precios de bittrex (solo BTC's)
 *
 * @callback (error,monedas)
 * 
 */
function obtenerPreciosBittrex(callback){

    getBitcoinPrices(function(error,monedas){

        if (error){
            return callback(error,undefined)
        }else {
            return callback(undefined, monedas)
        }
    })
}

// --------------------------------


// ANALISIS -----------------------

/**
 *
 * Comparamos los valores que acabamos de recibir con
 * los que tenemos en Mongo
 *
 * @param {Array[]} [monedas] [Los valores actuales de todas las inversiones]
 * 
 */
function compararValores(monedas){

    var filtros = {}
    filtros['IdAnalizar'] = {}
    filtros['IdAnalizar']['$exists'] = true
    filtros['IdUsuario'] = {}
    filtros['IdUsuario']['$gt'] = Rango.getRango()[0] // Comienzo del rango
    filtros['IdUsuario']['$lt'] = Rango.getRango()[1] // Final del rango

    obtenerInversiones.conFiltros(filtros,function(error,inversiones){

        if (error){}
        else {  

            //console.log('Tenemos  ', inversiones.length, ' inversiones en Mongo')
            console.log(inversiones)

            var invsVender = [] // Las inversiones que se van a vender
            var invsActualizar = [] // Las inversiones que suben parametros

            if (inversiones.length > 0){

                console.log('--------------' , monedas[Utils.getRandomInt(0,100)], '--------------')

            }

            console.log(monedas.length)
            console.log(inversiones.length)

            var count = 0
            for (let i=0;i<monedas.length;i++){

                process.nextTick(function(){

                    for (var a=0;a<inversiones.length;a++){

                        if (inversiones[a]['moneda'] == monedas[i]['MarketName']){

                            // Hay que subir parametros
                            if (inversiones[a]['metaW'] < monedas[i]['Last']){

                                console.log('El ultimo valor es mayor que nuestro meta win',' (', inversiones[a]['moneda'], ') ','(MetaW = ',inversiones[a]['metaW'], ')  (Ultimo = ',monedas[i]['Last'], ')')

                                invsActualizar.push(inversiones[a])

                            }

                            // Hay que vender las monedas
                        else if (inversiones[a]['metaSL'] > monedas[i]['Last']){

                                console.log('Hay que vender la moneda porque esta en perdida', ' (', inversiones[a]['moneda'], ') ' , '(MetaSL = ',inversiones[a]['metaSL'], ')  (Ultimo = ',monedas[i]['Last'], ')')
                                
                                // Añadimos este campo por necesidad para la funcion "seguimientoVentas.prepararVentas()"
                                inversiones[a]['noVendido'] = inversiones[a]['cantidad']
                                invsVender.push(inversiones[a])

                        }else {

                                console.log('Ni supera el Win ni supera el StopLoss,', ' (', inversiones[a]['moneda'], ') ' , '(MetaSL = ',inversiones[a]['metaSL'], ')  (MetaW = ',inversiones[a]['metaW'], ')  (Ultimo = ',monedas[i]['Last'], ')')

                            }                         
                        }
                    }

                    count++
                    if (count == monedas.length){


                        console.log('Se actualizara las metas de las siguientes inversiones ', invsActualizar)
                        //console.log('Inversiones a vender', invsVender)

                        venderInversiones(invsVender)

                        subirParametros(invsActualizar)

                    }
                })
            }
        }
    })
}

// -------------------------------- 

// POST-ANALISIS ------------------
 
/**
 *
 * Vendemos las inversiones que lo requieran
 *
 * @param {Array[]} [invsVender] [Inversiones que necesitan que se vendan]
 * 
 */
function venderInversiones(invsVender){

    console.log('Inversiones a vender', invsVender)

    // Obtenemos las keys de cada usuario
    getKeys(function(docs){

        console.log('Keys de los usuarios', docs)

        precioActualCompra(function(precioActuales){

            console.log('Nombre de las monedas obtenidas', precioActuales[0])
            console.log('Precios de las monedas obtenidas', precioActuales[1])

            var preciosActuales = {}
            preciosActuales['nombres'] = precioActuales[0]
            preciosActuales['precios'] = precioActuales[1]

            seguimientoVenta.prepararVentas(invsVender,docs,preciosActuales,function(ventasARealizar){

                seguimientoVenta.venderMonedas(ventasARealizar,function(fallidas,exitosas){

                    console.log('Ventas realizadas exitosamente', exitosas)

                    seguimientoVenta.actualizarEstadoVentas(exitosas,function(noGuardadas){

                        console.log('No guardadas ', noGuardadas)
                        // TODO Tratar a las inversiones que no hemos podido actualizar

                    })
                })
            })
        })
    })

    function getKeys (callback){

        var ids = [] // Usuarios que ya vamos a buscar
        var count = 0

        for(let a=0;a<invsVender.length;a++){

            process.nextTick(function(){

                if (!Utils.inArray(invsVender[a]['IdUsuario'],ids)){

                    ids.push(invsVender[a]['IdUsuario'])

                }

                count++

                if (count == invsVender.length){

                    var filtros = {}
                    filtros['$or'] = []

                    var c = 0

                    for (let i=0;i<ids.length;i++){

                        process.nextTick(function(){

                            var m = {}
                            m['falseId'] = ids[i]
                            filtros['$or'].push(m)

                            c++

                            if (c == ids.length){

                                var projection = {

                                    'falseId':1,
                                    'apiKey':1,
                                    'secretKey':1

                                }

                                obtenerParametros.conFiltros(filtros,projection,function(error,docs){

                                    if (error){

                                        // TODO Tratar de alguna manera 

                                    }else {
                                        return callback(docs)
                                    }
                                })
                            }
                        })
                    }
                }
            })
        }
    }

    function precioActualCompra(callback){

        var monedas = [] // Nombres de las monedas sin repeticiones
        var count = 0

        for (let a=0;a<invsVender.length;a++){

            process.nextTick(function(){

                if (!Utils.inArray(invsVender[a]['moneda'],monedas)){

                    monedas.push(invsVender[a]['moneda'])

                }

                count++

                if (count == invsVender.length){

                    var monedasConErrores = [] // Monedas de las que no disponemos precio
                    var monedasConPrecio = [[],[]] // Monedas de las que hemos podido obtener precio ([0]->Moneda,[1]->Precio)

                    var c = 0

                    console.log('Monedas a vender', monedas)

                    for (let i=0;i<monedas.length;i++){

                        process.nextTick(function(){

                            seguimientoVenta.actualPrecioCompra(monedas[i],function(monedaConError,result){

                                c++

                                if (monedaConError){

                                    monedasConErrores.push(monedaConError)

                                }else {

                                    monedasConPrecio[0].push(result['moneda'])
                                    monedasConPrecio[1].push(result['precio'])

                                }

                                if (c == monedas.length){

                                    // TODO Tratar a las monedas con er
                                    // 
                                    return callback(monedasConPrecio)

                                }
                            })
                        })
                    }
                }
            })
        }
    }
}

/**
 *
 * Subimos los parametros de las inversiones que superan su metaWin
 *
 * @param {Array[]} [invsActualizar] [Inversiones a las que subir los parametros]
 * 
 */
function subirParametros (invsActualizar) {

    var aCount = 0

    for (let a=0;a<invsActualizar.length;a++){

        process.nextTick(function(){

            var percW = invsActualizar[a]['lastPercW'] + Config.valoresPreinversion.escalonado  
            var percSL = invsActualizar[a]['lastPercSL'] + Config.valoresPreinversion.escalonado

            var nuevoMetaW =  ((percW / 100) * invsActualizar[a]['precioCompra']) + invsActualizar[a]['precioCompra']
            var nuevoMetaSL = invsActualizar[a]['precioCompra'] + ((percSL / 100) * invsActualizar[a]['precioCompra'])

            invsActualizar[a]['lastPercW'] = percW
            invsActualizar[a]['lastPercSL'] = percSL            
            invsActualizar[a]['metaW'] = (nuevoMetaW*1).toFixed(8)
            invsActualizar[a]['metaSL'] = (nuevoMetaSL*1).toFixed(8)

            aCount++

            if (aCount == invsActualizar.length){

                actualizarInversiones.enBatch(invsActualizar,function(conError){

                    if (conError == undefined){

                        lanzarAnalisis()
                        // No se han podido obtener las inversiones antes de guardarlas

                    }else if (conError.length == 0){

                        console.log('Se han actualizado las inversiones correctamente')
                        // Se actualizaron todas correctamente

                    }else if (conError.length > 0){

                        lanzarAnalisis()
                        // TODO Tratar de alguna manera a las inversiones con errores

                    }
                })      
            }
        })
    }
}

// --------------------------------

module.exports = lanzarAnalisis