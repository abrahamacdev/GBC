'use strict'

function inArray (target, array) {

  for(let i = 0; i < array.length; i++){
    if(array[i] === target)
    {
      return true;
    }
  }
  return false; 
}

function remove (array, element) {
    
    var index = array.indexOf(element)
    
    if (index !== -1) {
        
        array.splice(index, 1);
		return array
    }
}

function removeMap (array,key,value){
	
	if (array.length>0){
		
		for(var a=0;a<array.length;a++){
			
			console.log('Array [' + a + '] ' , array)
			
			if (array[a][key] != undefined){
				
				if(array[a][key] === value){
					
					array.splice(a,1)
				}
			}
		}
	}
	
	return array
}

function seeFreeMemory () {
    
    var os = require('os')
    
    var free = os.freemem() / 1024 / 1024;
    console.log('Memoria libre: ' + Math.round(free * 100) / 100 + ' MB')
    
}

function seeUsedMemory  ()  {
    
    var os = require('os')
     
    var used = process.memoryUsage().heapUsed / 1024 / 1024;
    console.log(`The script uses approximately ${Math.round(used * 100) / 100} MB`);
    
}

function forceGC () {
   if (global.gc) {
      global.gc();
   } else {
      console.warn('Start your program as `node --expose-gc file.js`.');
   }
}

function eliminarDuplicados (array) {
    
    var resultado = []
    
    if(array != null){
        
        var l = array.length
        
        for(var a = 0;a<l;a++){
            
            Object.keys(array[a]).forEach(function(element){
                
                if(!inArray(array[a][element],resultado)){
                    
                    resultado.push(array[a][element])
                    
                }
            })
        }
    }
    
    return resultado
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min) + min)
}

function getRandomFloat (min,max){
    return Math.random() * (max - min) + min
}


function easyLoop (l,callback){

  for (let a=0;a<l;a++){

    callback(a)

  }
}

function easyLoopAsync (l,callback){

    for (let a=0;a<l;a++){

      process.nextTick(function(){

          callback(a)

        })
    }
}

function loopWLMutation (l,process,exit){

    var index = 0,
      done = false,
      iterations = l 

    var loop = {
        next: function(){
            if (done){
                if (exit){
                    return exit()
                }
            }
            // Si no hemos terminado
            if(index < iterations){
                index++; // Incrementamos el index
                process(loop); // Devolvemos el estado actual del loop
            } else {
                done = true; // Terminamos el loop
                if(exit) exit(); // Llamamos al callback exit()
            }
        },

        index:function(){
            return index - 1; // Retornamos el index actual
        },

        break:function(){
            done = true; // Terminamos el loop
        },

        changeLenght:function(newL){
            iterations = newL // Seteamos la nueva longitud a recorrer
            index =  iterations - newL   // Decrementamos el index actual
        },

        changeByOneLess:function(){
            
            index++
        }
    }
    loop.next()
}

function loopWLMutationAsync (l,process,exit){

    var index = -1,
      done = false,
      iterations = l 

    var loop = {
        next: function(){
            process.nextTick(function(){
                if (done){
                    if (exit){
                        exit()
                    }
                }
                // Si no hemos terminado
                if(index < iterations){
                    index++; // Incrementamos el index
                    process(loop); // Devolvemos el estado actual del loop
                } else {
                    done = true; // Terminamos el loop
                    if(exit) exit(); // Llamamos al callback exit()
                }
            })
        },

        index:function(){
            return index; // Retornamos el index actual
        },

        break:function(){
            done = true; // Terminamos el loop
        },

        changeLenght:function(newL,less){
            iterations = newL // Seteamos la nueva longitud a recorrer
            index =  0  // index - (iterations - newL)  Decrementamos el index actual
        },

        changeByOneLess:function(){
            iterations--
        }
    }
    loop.next()
}

function easyLoopWithControl(l, process, exit){
    var index = 0,
        done = false,
        shouldExit = false;
    var loop = {

        next:function(){
            if(done){
                if(shouldExit && exit){
                    return exit(); // Terminamos el loop
                }
            }

            // Si no hemos terminado
            if(index < l){
                index++; // Incrementamos el index
                process(loop); // Devolvemos el estado actual del loop
            } else {
                done = true; // Terminamos el loop
                if(exit) exit(); // Llamamos al callback exit()
            }
        },
        iteration:function(){
            return index - 1; // Retornamos el index actual
        },
        break:function(end){
            done = true; // Terminamos el loop
            shouldExit = end; // Passing end as true means we still call the exit callback
        }
    };
    loop.next();
    return loop;
}

var operators = {

  '+': function(a,b){return a + b},
  '-': function(a,b){return a - b}

}

module.exports.inArray = inArray
module.exports.remove = remove
module.exports.removeMap = removeMap
module.exports.seeFreeMemory = seeFreeMemory
module.exports.seeUsedMemory = seeUsedMemory
module.exports.forceGC = forceGC
module.exports.eliminarDuplicados = eliminarDuplicados 
module.exports.getRandomInt = getRandomInt
module.exports.operators = operators
module.exports.easyLoop = easyLoop
module.exports.easyLoopAsync = easyLoopAsync
module.exports.loopWLMutation = loopWLMutation