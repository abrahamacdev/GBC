'use strict'

const obtenerParametros = require('./ObtenerParametros.js')
const parametrosModel = require('../../../modelo/Mongo/ParametrosModel.js')

/*
 * 
 * Metodo para actualizar los parametros de la base 
 * de datos de Mongo
 * 
 * @callback(error)
 * 
 */
module.exports = (args,callback) => {
    
    var keys = Object.keys(args) 
    
    if(keys.length == 0 || args == null){return callback({message:'Hay que enviar parámetros',status:400})}
    
    // Los datos que actualizaremos
    var argumentos = {};
    
    // Por cada elemento en #args, lo añadiremos a #argumentos
    keys.forEach(function(key){
        
        argumentos[key] = args[key]
        
    })
    
    //console.log('Argumentos =>')
    //console.log(argumentos)
    
    obtenerParametros(function(error,registro){
        
        registro = registro[0]
        
        //console.log('Registro antes =>')
        //console.log(registro)
        
        // Por cada elemento de #argumentos lo setearemos 
        // a #registro
        Object.keys(argumentos).forEach(function(key){
            
            registro[key] = argumentos[key]
            
        })
        
        //console.log('Registro despues =>')
        //console.log(registro)
        
        
        registro.save(function(error){
          
            if(error) {return callback(error)}
            
            return callback(null)
            
        })
    })
}