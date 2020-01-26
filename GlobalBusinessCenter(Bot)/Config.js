'use strict'

module.exports.tipoOpSaldo = {

    suma : '+',
    resta: '-'

}

module.exports.valoresDefMongo = {
	
	firstTargWin: 2,
    firstTargSL: -5,
	percRecPri: 7,
	percXInvs: 20
	
}

module.exports.web = 2 // ¡¡¡CUIDADO!!! Numero de workers dedicados a atender peticiones web

module.exports.workersLibres = 1 // ¡¡¡CUIDADO!!! Numero de workers que quedaran libres para un futuo

module.exports.valoresWorkers = {
    
    trabajoWeb : 1,
    trabajoAnalizar : 0,
	xNucleo: 100, // ¡¡¡CUIDADO!!!! Numero de usuarios por nucleo
	pmerInd: 0 // Primer indice del rango de usuario x nucleo
    
}

module.exports.valoresPreinversion = {
    
    cantidadMinima: 0.0005,
    escalonado: 1
    
}

module.exports.tiempoPenalizacion = Date.now() + 15 * 60 * 1000 // 15 min

module.exports.contador = {

    seguimientoVenta: 20000, // 20s
    seguimientoCompra: 45000, // 45s
    preInversion: 60000, // 1 min
    analizador: 10000 // 10seg

}

module.exports.hostCT = '212.111.41.183:8080'

module.exports.porcentajesCT = '/porcentajes'

module.exports.crecimientoMinimo = 0

module.exports.simulacion = true

module.exports.simulacionEstricta = true

module.exports.tipoInversiones = {

    compra: 1,
    venta: 2

}

