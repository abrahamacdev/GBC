'use strict'

// MODULOS EXTERNOS
const cluster = require('cluster');
const is_running = require('is-running')
const dotenv = require('dotenv').config()

// UTILIDADES
const Utils = require('../../Utils.js')
const Config = require(Utils.dirs().CT + 'Config.js')

var workers = [];  
var analizar = false
var web = false

// Lanzamos los workers
function lanzar(){
    
    // Utilizaremos esta variable para controlar la
    // primera vez que trabajo se asignara a cada worker
    var trabajoWeb = false;
    
    if(cluster.isMaster){
        
        for(var a=0;a<Config.valoresWorkers.n_workers;a++){
            
            var w = {};
             
            var worker = cluster.fork()

            if(trabajoWeb == true){
                w['pid'] = worker.process.pid
                w['trabajo'] = Config.valoresWorkers.trabajoWeb
                trabajoWeb = false
            }else{
                w['pid'] = worker.process.pid
                w['trabajo'] = Config.valoresWorkers.trabajoAnalizar
                trabajoWeb = true
            }
            
            worker.on('exit',function(worker,code,signal){
            exit()
            })
            
            worker.on('death',function(worker){
                death(worker)
            }) 
            
            workers.push(w)
            worker.send(workers)
        }
    
    }else{
        
        process.on('message', function(msg) {
            message(msg)
        })
    }
}

// Recibimos los mensajes que nos envia el Master
function message (msg){
    
    console.log(msg)
    
    for(var i=0;i<msg.length;i++){
        
        if(process.pid == msg[i]['pid']){
            
            if(msg[i]['trabajo'] == Config.valoresWorkers.trabajoAnalizar){
				
				var Hawk = require(Utils.dirs().core + 'hawk.js')
				new Hawk()
				
                // TODO Cambiar por trabajo Analizar
                console.log('Con este trabajo: ' + msg[i]['trabajo'] + ' tendre que ' + Config.valoresWorkers.trabajoAnalizar)
        
            }else{
                
				//var web = require(Utils.dirs().web + 'web.js')
                // TODO Cambiar por el trabajo Web
                console.log('Con este trabajo: ' + msg[i]['trabajo'] + ' tendre que ' + Config.valoresWorkers.trabajoWeb)


            }
            
        }
    }
}

// Controlamos desde el Master si un worker acaba
function exit (){
    
    for(var a = 0; a<workers.length; a++){
        
        Object.keys(workers[a]).forEach(function(key){
            
            if(key == 'pid'){
                
                if(is_running(workers[a][key]) == false){
                
                    // Si el proceso murio, lo eliminamos del array
                    // y utilizamos el existente para saber que 
                    // tarea debe de seguir
                    Utils.remove(workers,workers[a])
                    
                    var w = cluster.fork()
                    
                    w.on('exit',function(worker,code,signal){
                        exit(worker,code,signal)
                    })
                        
                    w.on('death',function(worker){
                        death(worker)
                    })
                    
                    var m = {}
                    m['pid'] = w.process.pid
                    
                    // Veremos el trabajo que tiene el proceso que sigue vivo
                    // y a partir de el, le encomendaremos el nuevo trabajo al nuevo worker
                    if(workers[0]['trabajo'] == Config.valoresWorkers.trabajoAnalizar){
                        
                        m['trabajo'] = Config.valoresWorkers.trabajoWeb
                        
                    }else{
                            
                        m['trabajo'] = Config.valoresWorkers.trabajoAnalizar
                        
                    }
                    
                    workers.push(m)
                    
                    w.send(workers)
    
                }
            }            
        })   
    }
}

// Controlamos desde el Master si un worker muere
function death (worker){
    
    console.log('El worker murio')
    
    exit()
    
    /*var w = cluster.fork()
    w.on('exit',function(worker,code,signal){
        exit(worker,code,signal)
    })
        
    w.on('death',function(worker){
        death(worker)
    })
    
    w.send(workers)*/
    
}

module.exports = lanzar