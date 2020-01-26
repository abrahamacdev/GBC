'use strict'


const bittrex = require('node-bittrex-api')
const mongoose = require('mongoose')
const moment = require('moment')
const dotenv = require('dotenv').config()

const Config = require('./Config.js')
const Utils = require('./Utils.js')
const preciosModel  = require('./modelo/Mongo/PreciosModel.js')
const velasModel = require('./modelo/Mongo/VelasModel.js')
const EMAModel = require(Utils.dirs().estrategias + 'FI_EMA/' + 'EMAModel.js')
const FIModel = require(Utils.dirs().estrategias + 'FI_EMA/' + 'FIModel.js')


const base_url = 'https://bittrex.com/Api/v2.0'
const lastest_ticks = '/pub/market/GetLatestTick?'
const default_tick_interval = 'thirtyMin'

Utils.connectMongo(function(error){

	console.time('a')

	//findPrecios()
	//findVelas()
	//velasXMoneda()
	//removeVelas()
	//removeEMAS()
	//removeFIS()
	findEMA()
	findFI()
	//comprobeCandle()
})

function velasXMoneda () {

	var query = velasModel.find({'moneda': 'BTC-MEME'}).sort({'expireAt':1}).exec(function(error,docs){

		if (error){throw error}
		else {

			console.log(docs)

		}
	})
}

function comprobeCandle () {

	getCandle('BTC-XRP',function(error,data){

		console.log(error)
		console.log(data)

	})
}

function getCandle (market,cb){

		var marketName = 'marketName=' + market
		var tickInterval = '&tickInterval=' + default_tick_interval
		var time = '&_=' + moment().unix()

		var url = base_url + lastest_ticks + marketName + tickInterval + time

		bittrex.sendCustomRequest(url, function(data, err) {
			
			if (err){

				return cb(err,undefined)
			}
			else  {
				return cb(undefined,data)
			}
		})
	}

function removeVelas () {

	velasModel.remove({},function(err,data){

		console.log('Eliminado')

	})
}

function removeEMAS() {

	EMAModel.remove({},function(err,data){

		if (err){throw err}
		console.log('Se ha eliminado todos los EMAS')

	})

}

function removeFIS(){

	FIModel.remove({},function(err,data){

		if (err){throw err}
		console.log('Se ha eliminado todos los FIs')

	})
}

function findEMA() {

	EMAModel.find({},function(err,data){

		if (err){}
		console.log('EMA')
		console.log(data[data.length - 1])
		console.log(data.length)
		console.timeEnd('a')

	})
}

function findFI () {

	FIModel.find({},function(err,data){

		if (err){}
		console.log('FI')
		console.log(data[data.length - 1])
		console.log(data.length)
		console.timeEnd('a')

	})
}

function findPrecios(){

	preciosModel.find({},function(err,data){

		if (err){}
		console.log('Precios')
		console.log(data.length)
		console.timeEnd('a')

	})
}

function findVelas ()  {

	velasModel.find({},function(err,data){

		if (err){}
		console.log('Velas')
		console.log(data[data.length - 1])
		console.log(data.length)

	})
}



/*for (var c = 0;c<5;c++){

	bittrex.getmarketsummaries(function(data,error){ 	
    if (error){return cb(error,undefined)}
	else {
		
		var base_url = 'https://bittrex.com/Api/v2.0/pub/market/GetLatestTick?marketName='
		var tickInterval = '&tickInterval='
		var time = '&_='
		var now = moment().unix()

		var errores = 0
		var bueno = 0

		var count = 0
		var d = []

		console.log('Peticiones a lanzar', data['result'].length)

		for (let i=0;i<data['result'].length;i++){

			var marketName = data['result'][i]['MarketName']
			var url = base_url + marketName + tickInterval + 'thirtyMin' + time + now

			'https://bittrex.com/Api/v2.0/pub/market/GetLatestTick?marketName=BTC-ZEN&tickInterval=fiveMinfiveMin&_=1513620393'


			getCandle(marketName,url,function(error,candle){

				count++

				if (error){errores++}
				else {

					d.push(data)
					bueno++

				}

				if (count == data['result'].length){

					console.log('Errores ', errores);
					console.log('Buenas ', d.length)
					

				}
			})
		}
	}
})

function getCandle(market,url,cb){

	bittrex.sendCustomRequest( url, function( data, err ) {
			
		if (err){

			console.log(err)
			return cb(market,undefined)
		}
		else  {return cb(undefined,data)}
	})
}

}*/


//crearParametros()
function crearParametros(){
	
	var parametros = {
		
		minutos:  4,  // En minutos
		intervalos: 2
	}
	
		
	parametrosModel.create(parametros,function(error,doc){

		if (error){console.log(error)}
		
		else {
			
			console.log(doc)
		}
	})
}

//buscarParametros(function(result){console.log(result)})
function buscarParametros (callback){
	
	parametrosModel.find(function(error,doc){
	
		if (error) {throw error}
		
		else {
			return callback(doc)
		}	
	})
	
}

//eliminarParametros()
function eliminarParametros() {

	parametrosModel.remove({},function(error,doc){

			if (error) {throw error}

			else {

			console.log('ELiminado ' + doc)

        }
	})
}

//actualizarParametros()
function actualizarParametros () {
	
	parametrosModel.find(function(error,doc){
	
		if (error) {throw error}
		
		else {
			
			if (doc.length > 0){
				
				console.log(doc)
				
				var horas =  [1* 60 * 1000] // En minutos

				doc[0]['horas'] = horas

				doc[0].save(function(er){
					
					if (er){throw er}
					
				})
			}
		}	
	})
}

//obtenerPreciosGuardados()
function obtenerPreciosGuardados() {
	
	var now = Date.now()
	var hora = 60 * 60 * 1000 // 2 min
	
	var hora_buscada = now - hora
	
	var gtn = hora_buscada 
	var ltn = hora_buscada + 30 * 60 * 1000
	
	console.log('Ahora ' , now)
	console.log(moment(hora_buscada))
	console.log('GT ' , gtn)
	console.log('LT ' , ltn)
	
	var filtros = {}
	filtros['fecha'] = {}
	filtros['fecha']['$gt'] = gtn
	filtros['fecha']['$lt'] = ltn
	
	console.log(filtros)
	
	var query = preciosModel.find(filtros)
	query.sort({moneda:1,fecha:1})
	query.exec(function(error,precios){
		
		var r = []
		
		if (error) {throw error}
		
		else {
		
			for (var a=0;a<precios.length;a++){
				
				
					
				r.push(a)
					
				
			}
			
			console.log(r)
			console.log(r.length)
		}
	})
}


//obtenerTodosPrecios()
function obtenerTodosPrecios () {
	
	console.time('a')
	var filtros = {}
	filtros['$or'] = []
	var m = {}
	m['fecha'] = {}
	m['fecha']['$gt'] = Date.now() - 60000 * 60
	m['fecha']['$lt'] = Date.now()
	filtros['$or'].push(m)
	
	var cursor = preciosModel.find().cursor()
	
	var ar = 0
	
	cursor.on('data',function(doc){
		
		ar++
		
	})
	
	cursor.on('error',function(error){
		
		
				
	})
	
	cursor.on('end',function(){
		
		Utils.seeFreeMemory()
		console.log(ar)
		console.timeEnd('a')
	})
	
}


//eliminarPerfiles()
function eliminarPerfiles(){
	
	perfilModel.remove({},function(error){
		
		if (error){throw error}
		
		securityModel.remove({},function(err){
			
			if (err){throw err}
			
			else {
				
				console.log('Se han borrado los perfiles exitosamente')
				
			}
		})
	})
}

//obtenerPerfiles()
function obtenerPerfiles(){
	
	perfilModel.find(function(error,docs){
		
		if (error) {throw error}
		
		else {
			
			console.log(docs)
			
		}
	})
}

//añadirPrecios()
function añadirPrecios(){

	var suma = Date.now()
	
	var result = []
	
	for (var a=0;a<10000;a++){
		var precio = {}
		precio['moneda'] = 'BTC-MCO'
		precio['fecha'] = suma
		precio['precio'] = 0.00003918
		
		result.push(precio)
	}
	
	preciosModel.insertMany(result,function(error,ok){
		
		if (error) {console.log(error)}
		console.log('ok')
		
	})
	
}


//eliminarPrecios()
function eliminarPrecios () {
	
	preciosModel.remove(function(error){
		
		if (error) {throw error}
		console.log('ELiminados')
	})
}


//obtenerPorcentajes()
function obtenerPorcentajes(){
	
	var filtros = {
	
		moneda: 'BTC-MANA'
		
	}
	
	porcentajesModel.find(function(error,docs){
		
		if (error){throw error}
		
		else {
			
			console.log(docs)
			
		}
	})
}


//eliminarPorcentajes()
function eliminarPorcentajes(){
	
	porcentajesModel.remove(function(error){
		
		if (error) {throw error}
		
	})
	
}

//obtenerTodosUsuarios ()
function obtenerTodosUsuarios() {
	
	perfilModel.find(function(err,doc){
		
		if (err) { throw err}
		
		else {
			
			securityModel.find(function(error,document){
				
				if (error) {throw error}
				
				else {
					
					console.log('Perfiles ' + doc)
					
					console.log('Security ' + document)
					
					console.log(moment(doc[0]['caducidad']))
				}
			})
		}
	})
}


//eliminarTodosUsuarios()
function eliminarTodosUsuarios() {
	
	perfilModel.remove(function(error,docs){
		
		if (error) {throw error}
		
		else  {
			
			securityModel.remove(function(err,removed){
				
				if (err){throw err}
				
				else {
					
					console.log('Se han eliminado todos los usuarios')
					
				}
			})
		}
	})
	
}


//co100000nsole.log("(1)El index mas cercano es: " + obtenerPeriodo(255450.60));
function obtenerPeriodo(value){
	
	/*console.time('a')
	var set = new Set()
	var arr = []
	
	for(var a=0;a<10000000;a++){
		
		arr.push(a)
		
	}
	
	set.add(arr)
	// By default that will be a big number
	var cV = Infinity;
	// We will store the index of the element
	var cI = -1;
	
	set.forEach(function(k){
		var diff = Math.abs(k - value);
		if (diff < cV) {
			cV = diff;
			cI = k;
		}
	})
	console.timeEnd('a')*/
	
	
	console.time('a')
	var array = []
	for(var a=0;a<10000000;a++){
		
		array.push(a)
		
	}
	
	for (var i = 0; i < array.length; i++) {
		
		if(value < array[i]){
			
			console.timeEnd('a')
			return array[i-1]
			
		}
	}
}


//console.log("(2)El index mas cercano es: " + pruebaVelocidad(255450.60));
function pruebaVelocidad (value){
		
	console.time('b')
	
	var array = []
	for(var a=0;a<10000000;a++){
		
		array.push(a)
		
	}
	var closestValue = Infinity;
	  // We will store the index of the element
	  var closestIndex = -1;
	  for (var i = 0; i < array.length; i++) {
		var diff = Math.abs(array[i] - value);
		if (diff < closestValue) {
		  closestValue = diff;
		  closestIndex = i;
		}
	  }
	
	console.timeEnd('b')
	return array[closestIndex-1] 
}

//xperiodos()
function xperiodos () {
	
	var now = Date.now()
	console.log(now)
	
	var fecha_to_minute = [] // Comprobaremos en que minuto exacto se encuentra
	
	buscarParametros(function(docs){
		
		var filtros = {}
	
		filtros['$or'] = []
		
		var hora_buscada = undefined
		var gtn = undefined
		var ltn = undefined
		
		var min_ya_busca = []
		var periodos = []
		
		for(var a=0;a<docs.length;a++){
			
			for (var i=0;i<docs[a]['minutos']/docs[a]['intervalos'];i++){
				
				var tmp = (i+1)*docs[a]['intervalos']
			
				if (!yaBuscado(tmp,min_ya_busca)){
					
					min_ya_busca.push(tmp)
					
				}
			}
		}
		
		min_ya_busca = min_ya_busca.sort(function(a, b){return a-b})
		
		
		for (var a=0;a<min_ya_busca.length;a++){
			
			periodos.push((min_ya_busca[a])*60*1000) // Pasamos los minutos a milisegundos
			
		}
		
		if (periodos.length > 0){
			
			for (var i=0;i<periodos.length;i++){
				
				hora_buscada = now - periodos[i] // Calculamos la hora que queremos obtener (siempre seran exactas)
			
				gtn = hora_buscada // Hora a superar
				ltn = hora_buscada + Config.desvioLTN // Hora que no hay que superar
				
				var condition = {}
				condition['fecha'] = {}
				condition['fecha']['$gt'] = gtn
				condition['fecha']['$lt'] = ltn
				
				console.log(condition , min_ya_busca[i] + 'min')
				filtros['$or'].push(condition) // Añadimos la condicion a la sentencia $or
				fecha_to_minute.push(gtn)
				
			}		
		}

		console.log('Fecha to minute ' , fecha_to_minute)
		
		var cursor = preciosModel.find(filtros).sort({fecha:-1}).lean().cursor()
	
		var results = []
		
		cursor.on('data',function(doc){
			
			if (doc != undefined){
				
				var indx = comprobarPeriodo(doc['fecha'],fecha_to_minute)
				//indx = indx + Config.desvioGTN
				console.log('Fecha del doc ' + doc['fecha'])
				doc['intervaloArray'] = indx // Precio de hace x minutos
				results.push(doc)

			}
		})
		
		cursor.on('error',function(error){
			
			console.log(error)
			
		})
		
		cursor.on('end',function(){
			
			console.log(results)
			console.log(results.length)
			
			Utils.seeUsedMemory()
			
			Utils.seeFreeMemory()
			
		})
	})
}


function comprobarPeriodo(fechaBuscada,intervalos){
	
	console.log('Fecha buscada ' , fechaBuscada)
	
	// Recorremos los periodos a la inversa
	//for (var i = intervalos.length-1; i >=0 ; i--) {
	for (var i = 0;i<intervalos.length; i++) {
		
		// Si la fecha es >= intervalo actual y < que el siguiente
		if(fechaBuscada >= intervalos[i]){
	
			return i+1
			
		}
	}
}

function yaBuscado (elemento, array){
	
	for(var a=0;a<array.length;a++){
		 
		if (array[a] == elemento){
			
			return true
			
		}
	}
	
	return false
}


var total = 3
var actual = 0
console.time('a')

//creacionRandom()
function creacionRandom () {
	
	if (total == actual){
		
		console.timeEnd('a')
		
	}else {
	
		var num_veces = 100000
	
		var monedas = ['BTC-MANA','BTC-MEME','BTC,ION','BTC-IOP','BTC-ETH','BTC-GOLD']
			
		var to_insert = []

		for (var i=0;i<num_veces;i++){
			
			var m = {}
			m['moneda'] = monedas[generateRandomInt(0,5)]
			m['precio'] = generateRandomFloat()
			m['fecha'] = generateRandomDate()
			
			to_insert.push(m)
			
		}
		
		preciosModel.create(to_insert,function(error){
		
			if (error) {console.log(error)}
			
			else {
				
				
				console.log(to_insert[0])
				actual++
				Utils.forceGC()
				creacionRandom()
				
			}
		})
	}
}

function generateRandomFloat () {
	
	return Math.random() * (20 - 0.0005) + 0.0005;
	
}

function generateRandomInt (max,min){
	
	return Math.floor(Math.random() * (max - min) + min);
	
}

function generateRandomDate () {
	
	return Math.floor(Date.now() - generateRandomInt(3600000,60000)) 
	
}
