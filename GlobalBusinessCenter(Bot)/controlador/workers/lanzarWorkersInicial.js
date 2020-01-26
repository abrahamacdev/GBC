'use strict'

const cluster = require('cluster');
var os = require('os')
const is_running = require('is-running')
const dotenv = require('dotenv').config()

const obtenerControl = require('../parametros_mongo/control/ObtenerControl.js')
const conectarDB = require('../../modelo/Mongo/MongoDB.js')
const Config = require('../../Config.js')
const Utils = require ('../../Utils.js')

var workers = [] 

var analizar = false
var web = false


// TODO Quitar comentarios
//var analizadores = (os.cpus().length) - (Config.workersLibres + Config.web) // Cantidad de analizadores que habra ejecutandose 
var analizadores = 1

var tmp_xNucleo = Config.valoresWorkers.xNucleo // Num de usuarios que acogera cada nucleo

var tmp_indActual = Config.valoresWorkers.pmerInd // Primer indice tmp de cada rango

/*
 * 
 * Creamos los nuevos workers y les seteamos su trabajo
 * 
 */
function lanzar(){

	if (cluster.isMaster){
		
		// Creamos el documento de control
		comprobarPrimVez(function(ok){
		
			if (ok){
				
				crearWorkers()
	
			}
		})
	
	// Worker
	}else {
		
		// Mensajes recibidos del Master
        process.on('message', function(msg) {
            message(msg)
        })
	}
}

/*
 * 
 * Comprobaremos si es la primera vez que lanzamos 
 * el analizador
 * @callback (ok)
 * 
 */
function comprobarPrimVez (callback){
	
	conectarDB.conectarMongo(function(error){

		if (error) {

			throw  error

		}else {

			obtenerControl(function(error,doc){
		
				if (error)  {throw error}
				
				else {
					
					console.log('Primera vez')

					if (doc != undefined){

						return callback(true)
						
					}
				}
			})
		}
	})
}

/*
 * 
 * Creamos los workers 
 * 
 */
function crearWorkers () {
	
	console.log('Cantidad de cpus ' + os.cpus().length)
		
	verResumenWorkers()
	
	for(var a=0;a<analizadores;a++){
		
		var w = {}
		
		var worker = cluster.fork()
		
		w['pid'] = worker.process.pid
		w['trabajo'] = Config.valoresWorkers.trabajoAnalizar
		w['rango'] = tmp_indActual + tmp_xNucleo
		tmp_indActual += tmp_xNucleo
		
		// El worker a terminado
		worker.on('exit',function(worker,code,signal){
			verResumenWorkers()
			exit()
		})
		
		// El worker a muerto
		worker.on('death',function(worker){
			verResumenWorkers()
			death(worker)
		}) 
		
		workers.push(w)
		worker.send(workers) // Enviamos los workers existentes al ultimo worker creado
		
	}
	
	var m = {}
	
	var worker = cluster.fork()
	
	m['pid'] = worker.process.pid
	m['trabajo'] = Config.valoresWorkers.trabajoWeb
	
	// El worker a terminado
	worker.on('exit',function(worker,code,signal){
		verResumenWorkers()
		exit()
	})
	
	// El worker a muerto
	worker.on('death',function(worker){
		verResumenWorkers()
		death(worker)
	}) 
	
	workers.push(m)
	worker.send(workers) // Enviamos los workers existentes al ultimo worker creado
}

/*
 * 
 * Recibimos los mensajes que envia el Master
 * @param Array [] msg
 * 
 */
function message (msg){
    
    //console.log(msg)
    
    for(var i=0;i<msg.length;i++){
        
        if(process.pid == msg[i]['pid']){
            
            if(msg[i]['trabajo'] == Config.valoresWorkers.trabajoAnalizar){
                
                //console.log('Con este trabajo: ' + msg[i]['trabajo'] + ' tendre que ' + Config.valoresWorkers.trabajoAnalizar)
				require('./rango.js').setRango(msg[i]['rango'])
				require('../analizador/lanzarAnalizador.js')()
				
				
                
            }else if (msg[i]['trabajo'] == Config.valoresWorkers.trabajoWeb){
                
                //console.log('Con este trabajo: ' + msg[i]['trabajo'] + ' tendre que ' + Config.valoresWorkers.trabajoWeb)
                //require('../web/web.js')()
            }
            
        }
    }
}

/*
 * 
 * Comprobamos que worker a acabado y cual es su
 * pid
 * 
 */
function exit (){
    
    for(var a = 0; a<workers.length; a++){
        
        Object.keys(workers[a]).forEach(function(key){
            
            if(key == 'pid'){
                
                if(is_running(workers[a][key]) == false){
                
                    // Eliminamos el worker del array
                    Utils.remove(workers,workers[a])
                    
                    var w = cluster.fork()
                    
                    w.on('exit',function(worker,code,signal){
                        verResumenWorkers()
						exit()
                    })
                        
                    w.on('death',function(worker){
						verResumenWorkers()						
                        death()
                    })
                    
                    var m = {}
                    m['pid'] = w.process.pid
					
					var arr = trabajoFaltante()
					
					// Es trabajoWeb
					if (arr[1] == undefined){
					
						m['trabajo'] = arr[0]
					
					}else {
						
						m['trabajo'] = arr[0]
						m['rango'] = arr[1]
						
					}
                    
                    
                    workers.push(m)
                    
                    w.send(workers)
    
                }
            }            
        })   
    }
}

/*
 * 
 * Controlamos cuando un worker muere
 * @param Worker
 * 
 */
function death (worker){
    
    console.log('El worker murio')
    
    exit()
}

/*
 * 
 * Comprobaremos el trabajo que tienen los workers
 * vivos y devolveremos el faltante
 * @return trabajoFaltante
 * 
 */
function trabajoFaltante(){
	
	var analizando = 0
	var rangos = []
	
	for (var a=0;a<workers.length;a++){
		
		Object.keys(workers[a]).forEach(function(key){
            
            if(key == 'trabajo'){
				
				if (workers[a][key] == Config.valoresWorkers.trabajoAnalizar){
					
					analizando++
					rangos.push(workers[a]['rango'])
					
				}
			}
		})
	}

	// Hace falta un analizador
	if (analizando < analizadores){
		
		var total = 0
		var tmpTotal = 0
		
		rangos.sort(function(a,b){return a-b})
		
		for (var a=0;a<analizadores;a++){
			
			// Ej: (0 * 100) + (100*1) = 100
			total += (a*Config.valoresWorkers.xNucleo) + (Config.valoresWorkers.xNucleo + Config.valoresWorkers.pmerInd) // TODO Modificar segun #xNucleo y #indActual
	
		}
		
		for (var a=0;a<rangos.length;a++){
			
			tmpTotal += rangos[a]
			
		}
		
		return [Config.valoresWorkers.trabajoAnalizar,total-tmpTotal]
		
	// Hace falta un servidor web
	}else {
		
		return [Config.valoresWorkers.trabajoWeb]
		
	}
}

/*
 * 
 * Resumen de los workers existentes
 * 
 */
function verResumenWorkers () {
	
	setTimeout(function(){
	
			console.log('Resumen de los procesos ' , workers)
			
	},100)
	
} 

module.exports = lanzar