'use strict'

var model = require('../../../modelo/Mongo/ParametrosModel.js')
var obtenerParametros = require ('./ObtenerParametros')


module.exports = () => {
        
    model.remove(function(error){
        
        if (error) {console.log(error)}
        
    })
    
}