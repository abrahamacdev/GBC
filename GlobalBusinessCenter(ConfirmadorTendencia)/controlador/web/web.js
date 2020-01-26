'use strict'

// MODULOS EXTERNOS
const express = require('express')
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const dotenv = require('dotenv').config()

// UTILIDADES
const Utils = require('../../Utils.js')

// HANDLERS
const estrategia = require(Utils.dirs().estrategiasWeb + 'estrategias.js')
const MongoDB = require(Utils.dirs().modeloMongo + 'MongoDB.js')


MongoDB(function(err){
	if (err){throw err}
})

var app = express()
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(methodOverride())
app.set("jsonp callback", true)

// API routes
var api = express.Router()


api.route('/estrategia')
	.post(estrategia)

	
app.use('/', api)

module.exports = app

// Iniciamos el servidor
app.listen(process.env.ServerPort, function() {
	console.log("Node server running on http://localhost:" + process.env.ServerPort);
});

