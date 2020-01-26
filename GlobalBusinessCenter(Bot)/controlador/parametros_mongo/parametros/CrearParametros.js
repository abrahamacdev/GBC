'use strict'

const mongoose = require('mongoose');
const parametrosModel = require('../../../modelo/Mongo/ParametrosModel')
const obtenerParametros = require('./ObtenerParametros.js')


/*
 * 
 * Creamos los valores por defecto a utilizar en las 
 * inversiones
 * @param Map (userEmail: xxx,perEscalDef: xxx ...etc)
 * @callback (error,inserted)
 * 
 */
module.exports = function(args,callback){
    
    obtenerParametros(function(error,datos){
        
        if(error){return callback(error,null)}
        
        else{
         
            // Si existe, no insertaremos uno nuevo
            if(existePerfil(datos)){return callback({message:'No se puede crear mas de un perfil',status:401},null)}
            
            else{
                
                if (Object.keys(args).length == 0 || args == null ){return callback({message:'Hay que enviar parámetros',status:400},null)}
                
                if('userEmail' in args){}
                
                // Comprobamos que introduce el correo
                else{return callback({message:'Hay que enviar parámetros',status:400},null)}
                
                var doc = new parametrosModel(args)
                
                /*if(args['percRecPri'] != undefined){argumentos['percRecPri'] = args.percRecPri}   
                if(args['perEscalDef'] != undefined){argumentos['perEscalDef'] = args.perEscalDef}        
                if(args['firstTargWin'] != undefined){argumentos['firstTargWin'] = args.firstTargWin}        
                if(args['firstTargSL'] != undefined){argumentos['firstTargSL'] = args.firstTargSL}        
                if(args['timeGetCurr'] != undefined){argumentos['timeGetCurr'] = args.timeGetCurr} 
                if(args['lastKeyAerospike'] != undefined){argumentos['lastKeyAerospike'] = args.lastKeyAerospike} */
                
                /*var doc = new parametrosModel({
                userEmail: argumentos.userEmail,
                perEscalDef: argumentos.perEscalDef,
                firstTargWin: argumentos.firstTargWin,
                firstTargSL: argumentos.firstTargSL,
                timeGetCurr: argumentos.timeGetCurr,
                lastKeyAerospike: argumentos.lastKeyAerospike
                });*/
                
                doc.save(function(error,doc){
                    
                    if(error){return callback(error,null)}
                    
                    return callback(null,true)
                    
                })

                
            }
        }
    })
}


/*
 * 
 * Comprobamos si en el array de datos hay mas de un
 * Map
 * @param Array[] 
 * @return Boolean
 * 
 */
function existePerfil(datos){
    
    if (datos[0] != null){
        
       return true
        
    }else{ return false}
    
}