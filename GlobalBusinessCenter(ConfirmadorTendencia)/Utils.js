'use strict'

// MODULOS EXTERNOS
const retry = require('retry')

// MODELO
const MongoDB = require('./modelo/Mongo/MongoDB.js')


var mongoConnected = false 

function inMapK (targets, map, callback){
	
	var isIn = []
	var notIn = []
	
	Object.keys(map).forEach(function(k){
		
		for (var a=0;a<targets.length;a++){
			
			if (k === targets[a]){
				
				isIn.push(targets[a])
			
			}
		}
	})
	
	return callback(isIn,notIn)
}

function remove (array, element) {
    
    var index = array.indexOf(element)
    
    if (index !== -1) {
        
        array.splice(index, 1);
    }
}

function seeFreeMemory () {
    
    var os = require('os')
    
    var free = os.freemem() / 1024 / 1024;
    console.log('Memoria libre: ' + Math.round(free * 100) / 100 + ' MB')
    
}

function seeUsedMemory  ()  {
    
    var os = require('os')
     
    var used = process.memoryUsage().heapUsed / 1024 / 1024;
    console.log(`The script uses approximately ${Math.round(used * 100) / 100} MB`);
    
}

function forceGC () {
   if (global.gc) {
      global.gc();
   } else {
      console.warn('Start your program as `node --expose-gc file.js`.');
   }
}

function eliminarDuplicados (array) {
    
    var resultado = []
    
    if(array != null){
        
        var l = array.length
        
        for(var a = 0;a<l;a++){
            
            Object.keys(array[a]).forEach(function(element){
                
                if(!inArray(array[a][element],resultado)){
                    
                    resultado.push(array[a][element])
                    
                }
            })
        }
    }
    
    return resultado
}

var util = {

    dirs: function() {
   
        var ROOT = __dirname + '/';

        return {
            CT: ROOT,
            web: ROOT + 'controlador/web/',
            comprobacionesWeb: ROOT + 'controlador/web/comprobaciones/',
            parametrosWeb: ROOT + 'controlador/web/parametros/',
            exchanges: ROOT + 'controlador/exchanges/',
            perfilesWeb: ROOT + 'controlador/web/perfiles/',
            core: ROOT + 'controlador/core/',
            workers: ROOT + 'controlador/workers/',
            estrategias: ROOT + 'controlador/core/estrategias/',
            modelo: ROOT + 'modelo/',
            modeloMongo: ROOT + 'modelo/Mongo/',
            plugins: ROOT + 'plugins',
            estrategiasWeb: ROOT + 'controlador/web/estrategias/'
        }
    },
    
    camposAnalisis: ['metaW','metaSL','lastPercW','lastPercSL','moneda','cantidad','precioCompra',
                    'escalonado','firstPerW','firstPerSL','saltoReajuste','saltoActual','ajustarMargenes'],

    inherit: function(dest, source) {
        require('util').inherits(
            dest,
            source
        );
    },
    makeEventEmitter: function(dest) {
        util.inherit(dest, require('events').EventEmitter);
    },
    connectMongo: function(cb){
        if (mongoConnected == true){}
        
        else {
            MongoDB(function(error){
                if(error) {return cb (error)}
                else{
                    mongoConnected = true
                    return cb(null)
                }
            })
        } 
    },
    toMS: function (time,unit){

        var factor = 0
        if (unit == 's'){
            factor = 1000
        }
        else {
            factor = 60000
        }
        return factor * time
    },
    inArray: function (target, array) {

        for(var i = 0; i < array.length; i++) {
            if(array[i] == target){
              return true;
            }
        }
        return false; 
    },
    indexOfLoop: function (target,array){
        for(var i = 0; i < array.length; i++) {
            if(array[i] == target){
              return i;
            }
        } 
        return
    },
    inMapValue: function (target,map){

        Object.keys(map).forEach(function(k,v){

            if (target === v){return true}

        })

        return false
    }
}

module.exports = util 
module.exports.inMapK = inMapK
module.exports.remove = remove
module.exports.seeFreeMemory = seeFreeMemory
module.exports.seeUsedMemory = seeUsedMemory
module.exports.forceGC = forceGC
module.exports.eliminarDuplicados = eliminarDuplicados 