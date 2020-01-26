'use strict'

// MODULOS EXTERNOS
const bittrex = require('node-bittrex-api')
const aerospike = require('aerospike')
const async = require('async')
const request = require('request')

// MONGO
const parametrosModel = require('../../modelo/Mongo/ParametrosModel.js')
const inversionesModel = require('../../modelo/Mongo/InversionesModel.js')
const obtenerParametros = require('../parametros_mongo/parametros/ObtenerParametros.js')
const actualizarTotalDisponible = require('../parametros_mongo/parametros/ActualizarTotalDisponible.js')
const inversionesXUsuario = require('../parametros_mongo/inversiones/obtenerXUsuario.js')
const obtenerPenalizadasXUsuario = require('../penalizaciones/obtenerPenalizadasXUsuario.js')

// BOT
const seleccionValoresOptimos = require('./seleccionValoresOptimos.js')
const seguimientoCompra = require('../seguimiento/seguimientoCompra.js')

// SIMULACION 
const compra = require('../simulacion/compra.js')
const sGetBalance = require('../simulacion/getBalance.js')

// UTILS
const Utils = require('../../Utils.js')
const Config = require('../../Config.js')
const rango = require('../workers/rango.js')

var realizandoInversion = false // Controlar instancias 

var rangos = undefined // Primer y ultimo valor del rango ([0] + 1-->1º, [1] -1 -->Ultimo)

var monedas = [] // Todas las monedas a comprar


/*
 * 
 * Realizamos una inversion 
 * 
 */
function realizarInversion() {
    
    rangos = rango.getRango()
    // Ya estamos haciendo una/s inversion/es
    if (realizandoInversion == true){}
    
    // Podemos realizar inversiones
    else {
        
        realizandoInversion = true

        // Hacemos algunas comprobaciones
        // TODO Añadir que solo cojas aquellos que tengan keys
        comprobarPreInversion(function(superanComprobaciones){
            
            console.log('Superan las comprobaciones: ', superanComprobaciones)
            
            // Obtenemos los mejores valores para invertir de cada usuario
            obtenerValoresOptimosXUsuario(superanComprobaciones,function(monedasXUsuario,mejoresValores){
                
                // Obtenemos las monedas no penalizadas de cada usuario
                obtenerNoPenalizadasXUsuario(monedasXUsuario,superanComprobaciones,function(noPenalizadasXUsuario){
                    
                    // Solo compraremos aquellas monedas que no tengamos
                    seleccionMonedasNuevas(noPenalizadasXUsuario,superanComprobaciones,function(noCompradasXUsuario){
                        
                        // Filtramos por el crecimiento de la moneda en las ultimas 3horas
                        filtrarCrecimienPositivo(noCompradasXUsuario,{minutos:[180],intervalos:[5]},function(primerCrecPositivo){
                            
                            console.log('Primer crecPositivo ' , primerCrecPositivo)
                            
                            // Filtramos de nuevo por el crecimiento de la moneda en los ultimos 30min
                            filtrarCrecimienPositivo(primerCrecPositivo,{minutos:[30],intervalos:[5]},function(segundoCrecPositivo){
                                
                                console.log('Segundo crec positivo ', segundoCrecPositivo)

                                // Calculamos la cantidad de operaciones que podemos hacer
                                calcularNumeroOperaciones(segundoCrecPositivo,function(opsXUsuario,parametros){
                                
                                    // Elegimos las monedas que vamos a comprar
                                    // de manera aleatoria
                                    elegirMonedas(segundoCrecPositivo,opsXUsuario,function(monedasElegidasXUsuario){
                                        
                                        console.log(' ')
                                        console.log('Preparamos compras ',monedasElegidasXUsuario)
                                        console.log(' ')
                                        
                                        // Preparamos las compras (precios,cantidades,moneda..etc)
                                        prepararCompra(monedasElegidasXUsuario,parametros,function(comprasXUsuario){
                                                        
                                            // Compramos las monedas elegidas
                                            comprarMonedas(comprasXUsuario,function(compradas,usuariosConCompras){

                                                // Calculamos la cantidad gastada por cada usuario
                                                prepararActualizacionSaldo(compradas,function(gastadoXUsuario){

                                                    // Actualizamos el saldo de cada usuario
                                                    actualizarSaldo(gastadoXUsuario,function(errores,params){

                                                        if (errores){console.log('Ha habido problemas a la hora de actualizar el saldo')}
                                                    
                                                        // Añadimos las monedas al seguimiento de compras
                                                        crearSeguimientoCompras(compradas,params)

                                                    })
                                                })                                                
                                            })
                                        })
                                    })    
                                })
                            })
                        })														
                    })
                })
            })
        })
    }
}


// COMPROBACIONES-----------------

/*
 * 
 * Realizamos una serie de comprovaciones antes de realizar una inversion
 * @callback (superanComprobaciones) [idX,idY]
 * 
 */
function comprobarPreInversion (callback){
        
    // Recuperamos las cuentas que tienen saldo
    tienenSaldoDisponible(function(tienenSaldo){
            
        // Comprobamos que las cuentas recuperadas tengan el bot corriendo
        estadoBot(tienenSaldo,function(botRunning){
              
            // COmprobamos que tengan licencia  
            tienenLicencia(botRunning,function(conLicencia){
                
                return callback(conLicencia)
                  
            })
        })
    })
}

/*
 * 
 * Comprobamos si tenemos dinero disponible (segun el bot)
 * @callback (tienenSaldo)
 * 
 */
function tienenSaldoDisponible (callback){
    
    var arg = {}
    arg['falseId'] = {}
    arg['falseId']['$gt'] = rangos[0] 
    arg['falseId']['$lt'] = rangos[1]
    
    obtenerParametros.conFiltros(arg,function(error,parametros){
        
        if (error){throw error}
        else {
        
            console.log('Tienen saldo ', parametros)
            var result = [] // Id's de los usuarios
            
            for (var a=0;a<parametros.length;a++){
                
                if (parametros[a]['totalDisponible'] >= parametros[a]['totalXInvs']){
                
                    result.push(parametros[a]['_id']) // Id del usuario
                
                }
            }

            if (result.length > 0){

                return callback(result)

            }else {

                acabarPreInversion()

            }
        }
    })
}

/*
 * 
 * Lo utilizamos para poder controlar el estado
 * del bot  
 * @param Array [] tienenSaldo (id's de los usuarios)
 * @callback (botRunning)
 * 
 */
function estadoBot(tienenSaldo,callback){
    
    var filtros = {}
    filtros['$or'] = []
    
    for (var a=0;a<tienenSaldo.length;a++){
        
        var args = {}
        args['_id'] = tienenSaldo[a]
        filtros['$or'].push(args)
        
    }
    
    obtenerParametros.conFiltros(filtros,function(error,datos){
        
        if (error) {throw error}
        
        else {
            
            var botRunning = [] // Id's de los usuarios con el bot en estado running
            
            for (var i=0;i<datos.length;i++){
                
                // Aquellos usuarios con el bot 'running'
                if (datos[i]['botState'] == 'running'){
                    
                    botRunning.push(datos[i]['_id']) // Id del usuario
                
                }
            }

            if (botRunning.length > 0){

                return callback(botRunning)

            }else {

                acabarPreInversion()

            }
        }
    })
}

/*
 * 
 * Comprobaremos si la persona tiene licencia
 * @param Array [] botRunning
 * @callback Boolean conLicencia
 * 
 */
function tienenLicencia (botRunning,callback){
    
    var filtros = {}
    filtros['$or'] = []
    
    for (var a=0;a<botRunning.length;a++){
        
        var args = {}
        args['_id'] = botRunning[a]
        filtros['$or'].push(args)
        
    }
    
    obtenerParametros.conFiltros(filtros,function(error,parametros){

        if (error){throw error}
        
        else {
            
            var conLicencia = [] // Id's de usuarios con licencia
            
            for (var i=0;i<parametros.length;i++){
                
                if (parametros[i]['tieneLicencia'] == true){
                    
                    conLicencia.push(parametros[i]['falseId']) // Añadimos el id numerico del usuario
                    
                }
            }

            if (conLicencia.length > 0){

                return callback(conLicencia)

            }else {

                acabarPreInversion()

            }
        }
    })
}

// --------------------------------



// SELECCION DE VALORES -----------	

/*
 * 
 * Obtenemos los valores optimos a utilizar en la inversion, sin duplicados
 * @param Array [] superanComprobaciones
 * @callback (valoresXUsuario,mejoresValores) {Monedas a comprar por cada usuario, Mejores valores obtenidos}
 * 
 */
function obtenerValoresOptimosXUsuario (superanComprobaciones,callback){
    
    var filtros = {}
    filtros['$or'] = []

    for (var a=0;a<superanComprobaciones.length;a++){
    
        var args = {}
        args['falseId'] = superanComprobaciones[a]
        filtros['$or'].push(args)
        
    }
    
    parametrosModel.find(filtros).sort({percRecPri: 1}).exec(function(error,parametros){
       
        if (error){throw error}
        else {
            if (parametros.length > 0){

                // Obtenemos los valores que superen el porcentaje mas bajo que tengamos en MOngo
                seleccionValoresOptimos(parametros[0]['percRecPri'],function(ordenados){
                    
                    if (ordenados == null || ordenados.length == 0){
                        
                        acabarPreInversion()
                        
                    }else {

                        ordenarValoresXUsuario(superanComprobaciones,ordenados,parametros,function(valoresXUsuario){

                            return callback (valoresXUsuario,ordenados)
                            
                        })  
                    }
                })
            }else {

                acabarPreInversion()

            }
        }
    })
}

/*
 * 
 * Ordenamos los mejores valores recibidos segun el orden 
 * del array "superanComprobaciones"
 * @param Array [] superanComprobaciones {array de ids}
 * @param Array [] mejoresValores {[0]->Nombre,[1]->% cambio}
 * @param Array [] parametros
 * @callback (valoresXUsuario) {lo usaremos para saber que moneda tiene que comprar cada usuario}
 * 
 */
function ordenarValoresXUsuario (superanComprobaciones,mejoresValores,parametros,callback) {

    var percs = [] // % a batir de cada usuario

    // Segun la posicion en #superanComprobaciones, añadimos el % a superar de cada usuario
    for (var a=0;a<superanComprobaciones.length;a++){
        
        for (var i=0;i<parametros.length;i++){

            if (superanComprobaciones[a] == parametros[i]['falseId']){
                
                percs.push(parametros[i]['percRecPri'] + 100)
                
            }
        }
    }

    // Recorremos el % a superar de cada usuario
    for (let i=0;i<percs.length;i++){
        
        process.nextTick(function(){

            var monedasDelUsuario = {}
            monedasDelUsuario['usuario'] = superanComprobaciones[i]
            monedasDelUsuario['monedas'] = []

                for (var a=0;a<mejoresValores.length;a++){

                    // Comprobamos que supere/iguale el % necesitado por
                    // el usuario
                    if (mejoresValores[a][1] >= percs[i]){
                        
                        monedasDelUsuario['monedas'].push(mejoresValores[a][0]) // Añadimos el nombre de la moneda
                        
                    }  
                }
            percs[i] = monedasDelUsuario  
            if (i == percs.length - 1){

                console.log('Monedas a comprar por cada usuario')
                console.log(percs)

                if (percs.length > 0){

                    return callback(percs)

                }else {

                    acabarPreInversion()

                }
            }
        })
    }
}

// --------------------------------



// FILTROS DE MONEDA---------------

/*
 * 
 * Obtenemos las monedas no penalizadas de cada usuario
 * 
 * @param Array[] monedasXUsuario (posibles monedas a invertir de cada usuario) [{'usuario':id,'monedas':[]}]
 * @param Array[] superanComprobaciones (array de id's)
 * 
 * @callback (noPenalizadasXUsuario)
 * 
 */
function obtenerNoPenalizadasXUsuario (monedasXUsuario,superanComprobaciones,callback){
        
    obtenerPenalizadasXUsuario(superanComprobaciones,function(penalizadas){

        eliminarPenalizadas(monedasXUsuario,penalizadas,function(sinPenalizacion){

            if (sinPenalizacion.length > 0){

                return callback(sinPenalizacion)
            
            }else {
        
                    acabarPreInversion()   
            }  
        })

    })	
}

/**
 *
 * Eliminamos las monedas penalizadas de cada persona
 *
 * @param {array} [noPenalizadas] [Monedas no penalizadas de cada usuario]
 * @param {array} [penalizadas] [Monedas penalizadas]
 *
 * @return {callback} [sinPenalizacion]
 * 
 */
function eliminarPenalizadas (noPenalizadas,penalizadas,callback) {

    for (let i = 0; i < noPenalizadas.length; i++) {
        
        process.nextTick(function(){

            for (var a = 0; a < penalizadas.length; a++) {
                
                if (penalizadas[a]['idUsuario'] == noPenalizadas[i]['usuario']){

                    for(var c=0;c<noPenalizadas[i]['monedas'].length;c++){

                        if (noPenalizadas[i]['monedas'][c] == penalizadas[a]['moneda'])
                           
                            noPenalizadas[i]['monedas'].splice(c,1)

                    }
                }
            }

            penalizadas.splice(a)

            if (i == noPenalizadas.length - 1){

                if (noPenalizadas.length == 0){acabarPreInversion()}
                else {

                    return callback(noPenalizadas)

                }
            }
        })
    }
}

/*
 * 
 * Comprobamos que no halla inversiones en las 
 * posibles monedas a comprar
 * @param Array noPenalizadasXUsuario {Array que contiene el nombre de las monedas no penalizadas}
 * @param Array superanComprobaciones {Ids de los usuarios}
 * @callback (noCompradas)
 * noCompradas-> [{usuario:_id,monedas:[xxx-xxx,xxx-xxx]}]
 * 
 */
function seleccionMonedasNuevas (noPenalizadasXUsuario,superanComprobaciones,callback) {

    async.parallel([
    
        function(cb){
            
            inversionesXUsuario(superanComprobaciones,{'moneda':1, 'IdUsuario':1},function(error,inversiones){
                
                if (error){
                    
                    console.log(error)
                    acabarPreInversion()
                    
                }
                
                else {

                    return cb(inversiones)
                }
            })
        }
    ],function(compradasXUsuario){
        
        if (compradasXUsuario.length == 0){return callback(noPenalizadasXUsuario)}
        else {
            
            //console.log('Compradas x usuario ', compradasXUsuario)
            console.log('No penalizadas ' , noPenalizadasXUsuario)

            // Cada usuario que ha pasado las comprobaciones
            for (let a=0;a<noPenalizadasXUsuario.length;a++){

                process.nextTick(function(){

                    for (let i=0;i<compradasXUsuario.length;i++){
                    
                        if (compradasXUsuario[i]['IdUsuario'] == noPenalizadasXUsuario[a]['usuario']){

                            for (let c=0;c<noPenalizadasXUsuario[a]['monedas'].length; c++){

                                if (compradasXUsuario[i]['moneda'] == noPenalizadasXUsuario[a]['monedas'][c]){

                                    //console.log('moneda', compradasXUsuario[i]['moneda'], noPenalizadasXUsuario[a]['monedas'][c])
                                    noPenalizadasXUsuario[a]['monedas'].splice(c,1)
                                    
                                    c = noPenalizadasXUsuario[a]['monedas'].length - 1
                                }

                            }
                            //console.log('Coinciden ', compradasXUsuario[i]['IdUsuario'] , noPenalizadasXUsuario[a]['usuario'])

                        }
                    }
                    if (a == noPenalizadasXUsuario.length - 1){
                        if (noPenalizadasXUsuario.length > 0){return callback(noPenalizadasXUsuario)}
                        else {acabarPreInversion()}
                    }
                })
            }
        }
    })
}  

/*
 * 
 * Comprobaremos que monedas tienen un crecimiento 
 * positivo
 * @param Array [] noCompradasXUsuario
 * @param Map{} parametros
 * @callback (positivas)
 * positivas-> [{usuario:_id,monedas:[xxx-xxx,xxx-xxx]}]
 * 
 */
function filtrarCrecimienPositivo(noCompradasXUsuario,parametros,callback) {
    
   /* if (Object.keys(parametros).length == 0) {acabarPreInversion()}
    
    else {
        
        //console.log(parametros)

        if (parametros['intervalos'].length == parametros['minutos'].length){
                    
                var args = {
        
                    monedas: [],
                    intervalos: [parametros['intervalos'][0]],
                    minutos: [parametros['minutos'][0]]
                }
                
                for (var a=0;a<noCompradasXUsuario.length;a++){
                    
                    for (var i=0;i<noCompradasXUsuario[a]['monedas'].length;i++){
                        
                        if (!Utils.inArray(noCompradasXUsuario[a]['monedas'][i],args['monedas'])){
                            
                            args['monedas'].push(noCompradasXUsuario[a]['monedas'][i])
                            
                        }
                    }	
                }
                
                //console.log(args)
                //console.log('Monedas enviadas ' ,args['monedas'].length)

                var clientServerOptions = {
                    uri: 'http://' + Config.hostCT + Config.porcentajesCT,
                    body: JSON.stringify(args),
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
                
                request(clientServerOptions, function (error, response) {
                    
                    if (error) {
                        
                        acabarPreInversion()
                
                    }
                    
                    else {
                        
                        // Respuesta en : response.request.responseContent.body
                        
                        var crecPositivo = []
                        
                        response = JSON.parse(response.request.responseContent.body)
                        
                        console.log('Response ' , response)
                        console.log('Monedas recibidas ' , Object.keys(response['result']).length)

                        if (response != undefined){
                            
                            if (response.status == 200){

                                if (response.result.length == 0){acabarPreInversion()}

                                else {

                                    Object.keys(response.result).forEach(function(k){


                                        if (response.result[k] > Config.crecimientoMinimo){
                                        
                                            crecPositivo.push(k)
                                        
                                        }
                                    })
                                    
                                    eliminarNegativas(noCompradasXUsuario,crecPositivo,function(sinNegativas){

                                        console.log(sinNegativas)

                                        return callback(sinNegativas)

                                    })
                                }   
                            }
                        }else {
                            
                            acabarPreInversion()
                            
                        }
                    }
                })
            
        }else {
            
            acabarPreInversion()
            
        }
    } */

    return callback(noCompradasXUsuario)

}

/**
 *
 * Eliminamos las monedas que tengamos en negativo de posibles compras
 *
 * @param {Array} [noCompradasXUsuario] [Monedas que aun no ha comprado el usuario]
 * @param {Array} [crecPositivo] [Monedas que estan en crecimiento positivo]
 *
 * @callbac (sinNegativas) Monedas a comprar con crecimiento positivo 
 * 
 */
function eliminarNegativas (noCompradasXUsuario,crecPositivo,callback){

    console.log('Crec positivo ' , crecPositivo)
    //console.log('No comprada por usuario ' , noCompradasXUsuario[0])

    for (let a=0;a<noCompradasXUsuario.length;a++){

        process.nextTick(function(){

            var tmp = []

            if (noCompradasXUsuario[a]['monedas'] == undefined){}

            else {

                for (var i=0;i<noCompradasXUsuario[a]['monedas'].length;i++){

                    if (crecPositivo.indexOf(noCompradasXUsuario[a]['monedas'][i]) > -1){

                        tmp.push(noCompradasXUsuario[a]['monedas'][i])

                    }
                }

                if (tmp.length == 0){

                    noCompradasXUsuario.splice(a)

                }else {

                    noCompradasXUsuario[a]['monedas'] = tmp        

                }

                if (a == noCompradasXUsuario.length - 1){

                    if (noCompradasXUsuario.length == 0){

                        acabarPreInversion()

                    }else {

                        return callback(noCompradasXUsuario)

                    }
                }
            }
        })
    }
}

// --------------------------------



// PRE-COMPRA----------------------

/*
 * 
 * Calculamos la cantidad de operaciones que podemos hacer
 * con el capital disponible
 * 
 * @param Array[] segundoCrecPositivo
 * 
 * @callback (opsXUsuario,parametros)
 * opsXUsuario-> [{usuario:_id,n_op:x}]
 * parametros-> [{parametrosModelX},{parametrosModelY}]
 * 
 */
function calcularNumeroOperaciones(segundoCrecPositivo,callback){
    
    var filtros = {}
    filtros['$or'] = []
    
    for (var a=0;a<segundoCrecPositivo.length;a++){
        
        var arg = {}
        arg['falseId'] = segundoCrecPositivo[a]['usuario']
        filtros['$or'].push(arg)
    
    }
    
    var projection = {}
    projection['falseId'] = 1
    projection['apiKey'] = 1
    projection['secretKey'] = 1
    projection['totalDisponible'] = 1
    projection['totalXInvs'] = 1
    
    var errores = []
    
    obtenerParametros.conFiltros(filtros,projection,function(error,parametros){
        
        if (error) {acabarPreInversion()}
        
        else {
            
            if (parametros.length == 0){

                acabarPreInversion()

            }else {
                
                console.log('Balance ', parametros)


                getBalance(parametros,function(error,availableXUsuario){
                
                    if (error) {

                        if (error.length > 0){

                            // TODO Tratar a los usuarios de los que no hemos podido obtener 
                            // balance disponible en bittrex

                        }
                    }
                    
                    else {
                        
                        if (availableXUsuario.length == 0){acabarPreInversion()}
                        else{
                            
                            opsXUser(availableXUsuario,parametros,function(opsXUsuario){

                                return callback(opsXUsuario,parametros)

                            })
                        }
                    }
                })   
            }
        }
    })
}

/*
 * 
 * Obtenemos el balance disponible 
 * 
 * @param Array[] parametros
 * 
 * @callback (error,available)
 * error-> {usuario:userId} // AUN NO DISPONIBLE
 * available-> {usuario:userId,available:data['result']['Available']}
 * 
 */
function getBalance (parametros,callback){
    
    if (Config.simulacion == true){

       sGetBalance.simular(parametros,function(availableXUsuario){

            return callback(null,availableXUsuario)

       }) 

    }else {

        var errores = []
        var results = []
        var count = 0

        for (let a=0;a<parametros.length;a++){
            
            process.nextTick(function(){

                bittrex.options({
                    apikey: parametros[a]['apiKey'],
                    apisecret : parametros[a]['secretKey']
                })

                getFromBittrex(parametros[a])

            })
        }

        function getFromBittrex (datos){

            bittrex.getbalance({currency : 'BTC'},function(data,error){
                    
                count++
                
                if (error){
                    
                    errores.push(error)
                    
                }else{
                    
                    results.push({'usuario':datos['falseId'],'available':data['result']['Available']})
                
                }
                
                if (count == parametros.length){
                    
                    //console.log(error)    
                    //console.log(results)
                    return callback(errores,results)
                    
                }
            })  
        } 
    }
}

/**
 *
 * Cantidad de operaciones que puede realizar cada usuario
 *
 * @param {Array} [availableXUsuario] [Disponible por usuario]
 * @param {Array} [parametros] [Parametros de cada usuario]
 *
 * @callback (opsXUsuario)
 * 
 */
function opsXUser (availableXUsuario,parametros,callback){

    for (let i=0;i<parametros.length;i++){
        
        process.nextTick(function(){

            for (var a=0;a<availableXUsuario.length;a++){
            
                if (parametros[i]['falseId'] == availableXUsuario[a]['usuario']){

                    if (availableXUsuario[a]['available'] > 0){

                        // Hay suficiente #totalDisponible para una o mas operaciones
                        if (parametros[i]['totalDisponible'] >= parametros[i]['totalXInvs']){
                            
                            var total = parametros[i]['totalDisponible']

                            // Comprobamos que solo se vaya a invertir como maximo el #totalAInvertir
                            if (parametros[i]['totalDisponible'] > parametros[i]['totalAInvertir']){
                                total = parametros[i]['totalAInvertir'] // Hay mas disponible que totalAInvertir
                            }else {
                                total = parametros[i]['totalDisponible'] // Hay menos disponible que totalAInvertir
                            }
                            // Numero de operaciones posibles con el #totalDisponible actual
                            var n_op = Math.floor(total / parametros[i]['totalXInvs'])
                            
                            console.log(parametros[i])
                            delete availableXUsuario[a]['available']
                            availableXUsuario[a]['n_op'] = n_op
                            
                        }else {

                            availableXUsuario[a] = {}

                        } 
                    }                                      
                }
            }

            if (i == parametros.length - 1){
                
                if (availableXUsuario.length > 0){

                    console.log('Available x user ', availableXUsuario)
                    return callback(availableXUsuario)

                }else {

                    acabarPreInversion()

                }
            }
        })
    }
}

/*
 * 
 * Elegimos las monedas en las que vamos a invertir 
 * 
 * @param Array[] mejoresValores 
 * @param Array[] opsXUsuario
 * @param Array[] superanComprobaciones 
 * 
 * @callback(monedasElegidasXUsuario)
 * monedasElegidasXUsuario-> [{usuario:id,aComprar:[xxx-xxx,xxx-xxx]}]
 * 
 */
function elegirMonedas (mejoresValores,opsXUsuario,callback){
    
    console.log(' ')
    console.log(' ')
    console.log('Mejores valores ', mejoresValores)
    console.log('Ops x usuario ', opsXUsuario)
    console.log(' ')

    // Recorremos los mejores valores
    for (let a=0; a<mejoresValores.length; a++){

        process.nextTick(function (){

            for (var i=0;i<opsXUsuario.length;i++){
                
                var monedas = []

                if (opsXUsuario[i]['usuario'] == mejoresValores[a]['usuario']){

                    if (opsXUsuario[i]['n_op'] >= mejoresValores[a]['monedas'].length){

                        monedas = mejoresValores[a]['monedas']

                    }

                    for (var e=opsXUsuario[i]['n_op'] - 1; e>=0; e--){

                        if (mejoresValores[a]['monedas'].length == 0){

                            e = opsXUsuario[i]['n_op'].length - 1

                        }else {

                            var random = Utils.getRandomInt(0,mejoresValores[a]['monedas'].length - 1)

                            if (mejoresValores[a]['monedas'][random] != undefined){

                                addMoneda(mejoresValores[a]['monedas'][random])

                                monedas.push(mejoresValores[a]['monedas'][random])

                                mejoresValores[a]['monedas'].splice(random,1)

                            }
                        }
                    }

                    opsXUsuario[i]['monedas'] = monedas
                    delete opsXUsuario[i]['n_op']

                }
            }

            if (a == mejoresValores.length - 1){

                return callback(opsXUsuario)

            }

        })
    }
}

/**
 *
 * Añadimos el nombre de la moneda al array Monedas
 *
 * @param {string} [moneda] [Nombre de la moneda]
 * 
 */
function addMoneda (moneda){

    if (!Utils.inArray(moneda,monedas)){

        monedas.push(moneda)

    }
}

/*
 * 
 * Preparamos las compras que se van a realizar (precios,currency,cantidad)
 * 
 * @param Array[] monedasElegidas
 * @param Array[] parametros
 * 
 * @callback(comprasXUsuario,parametros) 
 * comprasXUsuario-> [{usuario:id,monedas:[],precios:[],cantidades:[],apiKey:apikey,secretKey:secretkey}]
 * parametros -> 
 * 
 */
function prepararCompra (monedasElegXUsuario,parametros,callback){
    
    console.log('Monedas ', monedasElegXUsuario)
    var precioXMoneda = [] // [{moneda:xxx-xxx,precio:y}]
    var count = 0
    
    for (let a=0;a<monedas.length;a++){
        
        process.nextTick(function(){

            seguimientoCompra.obtenerNuevoPrecio(monedas[a],function(error,nuevoPrecio){
            
                count++
                
                if (error) {acabarPreInversion()}
                else {
                    
                    precioXMoneda.push(nuevoPrecio)
                    
                }
                
                if (count == monedas.length){
                    
                    monedas = []

                    compraXUsuario(function(comprasXUsuario){
                        
                        return callback (comprasXUsuario)
                        
                    })
                }
            })
        })
    }
    
    function compraXUsuario (callback) {
        
        Utils.seeUsedMemory()
        console.log('Precios ', precioXMoneda)

        var results = []
        
        for (let a=0;a<monedasElegXUsuario.length;a++){
        
            process.nextTick(function(){

                if (monedasElegXUsuario[a]['monedas'].length == 0){}

                else {

                    var args = {}
                    args['usuario'] = monedasElegXUsuario[a]['usuario']
                    args['monedas'] = []
                    args['precios'] = []
                    args['cantidades'] = []
                
                    var cantidad
                    
                    for (var l=0;l<parametros.length;l++){

                        if (parametros[l]['falseId'] == monedasElegXUsuario[a]['usuario']){

                            args['apiKey'] = parametros[l]['apiKey']
                            args['secretKey'] = parametros[l]['secretKey']

                            for (var p=0;p<monedasElegXUsuario[a]['monedas'].length;p++){
                        
                                for (var e=0;e<precioXMoneda.length;e++){
                                
                                    if (precioXMoneda[e]['moneda'] == monedasElegXUsuario[a]['monedas'][p]){
                                        
                                        args['monedas'].push(precioXMoneda[e]['moneda'])
                                        cantidad = ((parametros[l]['totalXInvs'] / precioXMoneda[e]['precio'])*1).toFixed(8)
                                        args['precios'].push(precioXMoneda[e]['precio']*1)
                                        args['cantidades'].push(cantidad)
                                                
                                    }
                                }
                            }
                        }
                    }
                    results.push(args)
                }

                if (a == monedasElegXUsuario.length - 1){

                    if (results.length > 0){
                        
                        return callback (results)
                        
                    }else {
                        
                        acabarPreInversion()
                        
                    }
                }
            })
        }
    }
}

// -------------------------------- 



// COMPRA -------------------------

/*
 * 
 * Compramos las monedas que recibimos en el map,
 * con la cantidad y el precio especificados
 * 
 * @param Array [] comprasXUsuario [{usuario:id,monedas:[],precios:[],cantidades:[],apiKey:apikey,secretKey:secretkey}]
 *
 * @callback (compradas,usuariosConCompras)
 * compradas-> [{usuario:usuario,moneda:moneda,cantidad:cantidad,precio:precio}]
 * usuariosConCompras->[{usuario:usuario,gastado:xxx}]
 * 
 */
function comprarMonedas (comprasXUsuario,callback) {

    var compradas = []
    var errores = []
    
    var usuariosConCompras = [] // Usuario que han realizado una compra exitosamente
    var count = 0

    console.log('')

    for(let a = 0; a<comprasXUsuario.length;a++){

        process.nextTick(function(){

            bittrex.options({
                'apikey' : comprasXUsuario[a]['apiKey'],
                'apisecret' : comprasXUsuario[a]['secretKey']
            })

            var compradasCount = 0
            var erroresCount = 0

            for (let i=0;i<comprasXUsuario[a]['monedas'].length;i++){

                var datos = {}

                datos['usuario'] = comprasXUsuario[a]['usuario'] 
                datos['moneda'] = comprasXUsuario[a]['monedas'][i]
                datos['precio'] = comprasXUsuario[a]['precios'][i]
                datos['cantidad'] = comprasXUsuario[a]['cantidades'][i]
                
                console.log('Datos pre compra ', datos)

                tradeBuy(datos,function(error,comprada){

                    console.log('Comprado sin error', comprada)
                    console.log('Compra con error', error)

                    if (error) {

                        errores.push(error)
                        erroresCount++

                    }
                    else {

                        compradasCount++

                        if (!Utils.inArray(comprada['usuario'],usuariosConCompras)){

                            usuariosConCompras.push(comprada['usuario'])

                        }
                        compradas.push(comprada)
                    }

                    // Comprobamos que se hallan comprado todas las monedas preparadas 
                    // para el usuario
                    if ((compradasCount + erroresCount) == comprasXUsuario[a]['monedas'].length){

                        console.log('Llega')

                        count++
                        
                        console.log('Count && compras x usuario ', count, ' - ', comprasXUsuario.length)
                        console.log(comprasXUsuario)

                        if (count == comprasXUsuario.length){

                            console.log('Monedas compradas ------------')
                            console.log(compradas)

                            if (compradas.length > 0){

                                return callback(compradas,usuariosConCompras)

                            }else {

                                acabarPreInversion()

                            }
                        }
                    }
                })
            }
        })
    }
}

/*
 * 
 * Lanzamos la orden de compra
 * 
 * @param Map {} datosCompra ('moneda':moneda,'cantidad':cantidad,'precio':precio)
 * 
 * @callback (error,comprada) 
 *
 * error->{usuario:usuarioId,moneda:moneda,precio:precio,cantidad:cantidad}
 * comprada->{usuario:usuarioId,moneda:moneda,precio:precio,cantidad:cantidad}
 * 
 */
function tradeBuy (datosCompra,callback){
    
    if (Config.simulacion == false){

        var options = {
            OrderType: 'LIMIT',
            TimeInEffect: 'GOOD_TIL_CANCELLED', // supported options are 'IMMEDIATE_OR_CANCEL', 'GOOD_TIL_CANCELLED', 'FILL_OR_KILL'
            ConditionType: 'NONE', // supported options are 'NONE', 'GREATER_THAN', 'LESS_THAN'
            Target: 0 // used in conjunction with ConditionType
        }
            
        options['MarketName'] = datosCompra['moneda']
        options['Rate'] = datosCompra['precio']
        options['Quantity'] = datosCompra['cantidad']

        bittrex.tradebuy(options,function(data,err){
    
            if(err){return callback(datosCompra,null)}
            
            else{
                
                if(data['success'] == true){
                    
                    datosCompra['idCompra'] = data['result']['OrderId']
                    datosCompra['cantidad'] = data['result']['Quantity']
                    datosCompra['precio'] = data['result']['Rate']
                    return callback (null,datosCompra)

                }else {

                    return callback(datosCompra,null)

                }
            }
        })
    }else {

        compra.simular(datosCompra,function(simulada){

            if (simulada != undefined){

                return callback(undefined,simulada)
            }else {

                return callback(datosCompra,undefined)
            }
        })
    }
}

// --------------------------------


// POST-COMPRA --------------------

/**
 *
 * Preparamos la cantidad a actualizar en el saldo de cada persona
 *
 * @param {Array} [compradasXUsuario] [Monedas compradas por cada usuario]
 *
 * @callback (gastadoXUsuario)
 * 
 */
function prepararActualizacionSaldo (compradasXUsuario,callback){

    console.log('Preparar actualizacion saldo ', compradasXUsuario)

    var usuarios = []
    var gastado = []
    
    var count = 0

    var coincide = false

    Utils.easyLoopAsync(compradasXUsuario.length,function(a){

        Utils.easyLoop(usuarios.length,function(i){

            if (usuarios[i] == compradasXUsuario[a]['usuario']){

                coincide = true
                var aSumar = compradasXUsuario[a]['precio'] * compradasXUsuario[a]['cantidad']
                gastado[i] = (gastado[i]*1 + (aSumar*1)).toFixed(8)                    

            }
        })

        if (coincide == false){

            var m = (compradasXUsuario[a]['precio'] * compradasXUsuario[a]['cantidad']).toFixed(8)
            m = m*1
            usuarios.push(compradasXUsuario[a]['usuario'])
            gastado.push(m)

        }

        coincide = false

        count++

        if (count == compradasXUsuario.length){

            var gastadoXUsuario = [] // Cantidad gastada por cada usuario

            count = 0

            Utils.easyLoopAsync(usuarios.length,function(e){

                var m = {}
                m['usuario'] = usuarios[e]
                m['cantidad'] = gastado[e]

                gastadoXUsuario.push(m)

                count++

                if (count == usuarios.length){

                    console.log('Gastado x usuario ', gastadoXUsuario)

                    if (gastadoXUsuario.length > 0){

                        return callback(gastadoXUsuario)

                    }else {

                        acabarPreInversion()

                    }
                }
            })
        }
    })
}

/**
 * 
 * Actualizamos el saldo virtual de cada usuario
 *
 * @param {Array[]} [gastadoXUsuario] [Total gastado por cada usuario]
 *
 * @callback (errores,params)
 * errores-> [{falseId:id,totalDisponible:xx}]
 * params-> [{userX},{userY}]
 * 
 */
function actualizarSaldo (gastadoXUsuario,callback){

    var filtros = {}
    filtros['$or'] = []

    var ids = []

    Utils.easyLoop(gastadoXUsuario.length,function(i){

        if (!Utils.inArray(gastadoXUsuario[i]['usuario'],ids)){

            ids.push(gastadoXUsuario[i]['usuario'])

            var  m = {}
            m['falseId'] = gastadoXUsuario[i]['usuario']

            filtros['$or'].push(m) 

        }


    })      

    var query = parametrosModel.find(filtros)
    query.exec(function(error,docs){

        if (error){

            console.log(error)
            acabarPreInversion()
        }

        else {

            var errores = []

            for (let c=0;c<docs.length;c++){

                process.nextTick(function(){

                    var count = 0 

                    for (var e=0;e<gastadoXUsuario.length;e++){

                        count++

                        if (gastadoXUsuario[e]['usuario'] == docs[c]['falseId'].toString()){

                            docs[c]['totalDisponible'] = (docs[c]['totalDisponible'] - gastadoXUsuario[e]['cantidad']).toFixed(8)
                  
                        }
                    }

                    docs[c].save(function(err,doc){

                        if (err){
                            errores.push(doc)
                        }

                        else {

                            // Retornamos los callbacks una vez que se han procesado 
                            // todos los saldos
                            if (c == docs.length - 1 && count == gastadoXUsuario.length){

                                if (errores.length == 0){

                                    return callback(null,docs)

                                }else {

                                    return callback(errores,docs)

                                }
                            }
                        }
                    })
                })
            }
        }
    })
}

/**
 *
 * Guardamos la inversion en MongoDB con el idCompra 
 *
 * @param {Array[]} [compradasXUsuario] [Cada una de las compras hechas por cada usuario]
 * @param {Array[]} [params] [Parametros de cada usuario]
 * 
 */
function crearSeguimientoCompras (compradasXUsuario,params){

    var invs = []

    console.log('Monedas a crear seguimiento ', compradasXUsuario)
    console.log('Parametros de los usuarios ', params)


    for (let a=0;a<params.length;a++){

        process.nextTick(function(){

            for (var i=0;i<compradasXUsuario.length;i++){

                if (params[a]['falseId'] == compradasXUsuario[i]['usuario']){

                    var m = {}
                    m['moneda'] = compradasXUsuario[i]['moneda']
                    m['precioCompra'] = compradasXUsuario[i]['precio']
                    m['cantidad'] = compradasXUsuario[i]['cantidad']
                    m['IdUsuario'] = params[a]['falseId']
                    var w = (compradasXUsuario[i]['precio']*1) * (params[a]['percFirstTargWin']*1 / 100)
                    console.log(w)
                    m['metaW'] = (w + (compradasXUsuario[i]['precio']*1)).toFixed(8)
                    var sl = (compradasXUsuario[i]['precio']*1) * (params[a]['percFirstTargSL']*1 / 100)
                    console.log(sl)
                    m['metaSL'] = ((compradasXUsuario[i]['precio']*1) + sl).toFixed(8)
                    m['lastPercW'] = params[a]['percFirstTargWin']
                    m['lastPercSL'] = params[a]['percFirstTargSL']                                              
                    m['IdCompra'] = compradasXUsuario[i]['idCompra']

                    invs.push(m)
                    compradasXUsuario.splice(i,1)
                    i--

                }
            }

            if (a == params.length - 1){

                if (invs.length > 0){

                    inversionesModel.create(invs,function(error,docs){

                        if (error) {
                        
                            acabarPreInversion()
                            console.log(error)
                        
                        }
                        else {

                            console.log('Guardadas ', docs)
                            acabarPreInversion()

                        }
                    })
                }else {

                    acabarPreInversion()

                }
            }
        })
    }
}

/*
 * 
 * Acabamos con la actual instancia del preInversor
 * 
 */
function acabarPreInversion (){
    
    realizandoInversion = false  
}

// --------------------------------

/*
 * 
 * Intentaremos realizar de nuevo la 
 * preInversion
 * 
 */
/*function reintentarPreInversion () {
    
    realizandoInversion = false
    
    setTimeout(function(){
        
        realizarInversion()
        
    },5000) // Esperamos 5 segundos	
}*/

/*
 * 
 * Obtenemos si hay alguna instancia activa del preInversor
 * @callback (instancia)
 * 
 */
function obtenerInstanciaInversion (callback){
    
    return callback(realizandoInversion)    
}

module.exports = realizarInversion

