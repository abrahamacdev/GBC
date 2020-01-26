'use strict'

const controlModel = require('../../../modelo/Mongo/Control.js')

module.exports.añadir = (nUsers) => {

	controlModel.update({},{$inc: {allocatedUsers:nUsers}},function(error,doc){

		if (error) {throw error}
	})
}

module.exports.eliminar = (nUsers) => {

	if (nUsers != undefined && nUsers > -1){

		controlModel.find({},function(error,docs){

			if (error) {throw error}
			else {

				docs = docs[0]
				docs['allocatedUsers'] = docs['allocatedUsers'] - nUsers
				console.log(docs, nUsers)

				docs.save(function(err,doc){

					if (err){throw err}

				}) 
			}
		})
	}
}