'use strict'

// UTILIDADES
const Utils = require('../../../Utils.js')

// ESTRATEGIAS
const FI_EMA = require(Utils.dirs().estrategiasWeb + 'FI_EMA.js')

module.exports = (req,res) => {

	var body = req.body

	if (body.estrategia != 'FI_EMA'){

		return res.jsonp({status:404,result:'No conocemos la estrategia que propones'})

	}else {

		FI_EMA(body,res)

	}
}