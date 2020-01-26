'use strict'

const Config = require('../../Config.js')
const preInversion = require('../inversion/preInversion.js')
const seguimientoCompras = require('../seguimiento/seguimientoCompra.js')
const seguimientoVentas = require('../seguimiento/seguimientoVenta.js')
const analizador = require('../analizador/analizador.js')

var cSV = false // Instancia del contador (Seguimiento ventas)

var cSC = false // Instancia del contador (Seguimiento compras)

var cPreInversion = false // Instancia del contador (PreInversion)

var cAnalizador = false // Instancia del contador (analizador)

var primeraVez = false //Lanzar la primera vez rapidamente

/*
 * 
 * Contador para la actualizacion del CAV
 * 
 */
function lanzarContadores () {
	
	if (primeraVez == false){

		primeraVez = true

		seguimientoVentas()
		analizador()
		seguimientoCompras()
		preInversion()

	}

	contadorAnalizador()

	contadorSeguimientoCompras()

	contadorSeguimientoVentas()
	
	contadorPreInversiones()
}

/**
 *
 * Contador del analizador
 * 
 */
function contadorAnalizador(){

	if (cAnalizador == true){}
	else {

		cAnalizador = true

		setTimeout(function(){

			cAnalizador = false

			contadorAnalizador()
			analizador()

		},Config.contador.analizador) // 10 segundos
	}
}


/**
 *
 * Contador del seguimiento de ventas
 * 
 */
function contadorSeguimientoVentas (){

	if (cSV == true){}

	else {

		cSV = true // Creamos una instancia 

		setTimeout(function(){
			
			cSV = false // Finalizamos la instancia actual
			
			contadorSeguimientoVentas() // Volvemos a lanzar el contador
			
			seguimientoVentas() // Comprobamos las ventas
			
		},Config.contador.seguimientoVenta) // 20s	
	}
}

/**
 *
 * Contador del seguimiento de compras
 * 
 */
function contadorSeguimientoCompras (){

	if (cSC == true){}

	else {

		cSC = true // Creamos una instancia 

		setTimeout(function(){
			
			cSC = false // Finalizamos la instancia actual
			
			contadorSeguimientoCompras() // Volvemos a lanzar el contador
			
			seguimientoCompras() // Comprobamos las compras
			
		},Config.contador.seguimientoCompra) // 45s	
	}
}

/*
 * 
 * Contador para realizacion periodica de preInversiones
 * 
 */
function contadorPreInversiones (){
	
	if (cPreInversion == true){}
	
	else {
		
		cPreInversion = true // Creamos una instancia
		
		setTimeout(function(){
			
			cPreInversion = false
			
			contadorPreInversiones() // Volvemos a lanzar el contador
			
			preInversion() // Realizamos una nueva preInversion

		},Config.contador.preInversion)// 1 min		
	}
	
}

module.exports = lanzarContadores