'use strict'

// No queremos logs en consola
if (process.env.NODE_ENV.trim() !== 'dev'){

	console.log = function(){}
	
}

const fs = require('fs')
const intercept = require("intercept-stdout")(function(msg){
	
	guardarLog(msg)
	
})

var fileExist = false // Existencia de log.txt

/*
 * 
 * Guardamos los logs
 * @param String msg
 * 
 */
function guardarLog(msg) {
	
	// El archivo no existe 
	if (fileExist == false){
		
		if (!fs.existsSync('log.txt')) {
			
			fs.writeFileSync('log.txt', msg)
			fileExist = true
			
		}else {
			
			fileExist = true
			escribirDatos(msg)
			
		}		
		
	// El archivo existe	
	}else {
		
		escribirDatos(msg)

	}
}

/*
 * 
 * Escribimos los logs al archivo log.txt
 * @param String msg
 * 
 */
function escribirDatos (msg) {
		
	fs.appendFile('log.txt','\n'+msg, function(error) {})
	
}