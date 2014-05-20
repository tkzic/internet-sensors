var LibOSC = (function(){
    var instantiated;

    function init(){

        var KOMMA = 44;
        var ZERO = 0;
        var byteConverter = ByteConverter.getInstance();

        function align(index){
            return index + 4 - (index %4);
        }

        function concatAndAlign(baseArray,scndArray){
            baseArray = baseArray.concat(scndArray);
            return fillToFour(baseArray);
        }

        function fillToFour(array){
            for(var needPadding = array.length % 4;needPadding < 4; needPadding++){
                array.push(0);
            }
            return array;
        }

        function parseAddressPattern(message, offset){
            return byteConverter.stringFromBytes(message,offset);
        }

        function parseTypeFlags(message, offset){
            var result = new Array();
            var currentChar = -1;

            if(message[offset] == KOMMA){
                offset += 1;

                while(currentChar != ZERO){
                    result.push(String.fromCharCode(message[offset]));
                    offset += 1;
                    currentChar = message[offset];
                }
                return {"typeFlags" : result, "index" : offset};
            }
        }

        function parseValues (message,offset,typeFlags){
            var results =  new Array(typeFlags.length);
            var currentChar = -1;

            for(var i = 0; i < typeFlags.length; i++){
                var flag = typeFlags[i];

                if(flag == "i"){ // 32 bit int
                    results[i] = byteConverter.int32FromBytes(message,offset);
                     offset = offset + 4;

                } else if(flag == "s"){// string
                    var tempStringResult = byteConverter.stringFromBytes(message,offset);
                    results[i] = tempStringResult.result;
                    offset = tempStringResult.index;
                    offset = align(offset);

                } else if(flag == "f"){ // 32 bit float
                    results[i] = byteConverter.float32FromBytes(message,offset);
                    offset = offset + 4;
                    
                } else if(flag == "h"){ // 64 Bit int
                    results[i] = byteConverter.int64FromBytes(message,offset);
                    offset = offset + 8;

                }else{
                    console.log(flag);
                    //TODO 
                    //rest of parsing see specifications on osc website
                }
            }   
            return results;
        }

        // PUBLIC FUNCTIONS
        return {
            createOSCMsg : function(address,typeArray,valueArray){
                var byteArray = [];

                byteArray = concatAndAlign(byteArray,byteConverter.stringToByte(address));
                byteArray.push(KOMMA);
                byteArray = concatAndAlign(byteArray,byteConverter.stringToByte(typeArray.join("")));

                for(var i = 0; i < typeArray.length; i++){
                    if(typeArray[i] == "i"){
                        // 32 bit int
                        byteArray = byteArray.concat(byteConverter.int32ToByte(valueArray[i]));
                    } else if(typeArray[i] == "f"){
                        // 32 bit float
                        byteArray = byteArray.concat(byteConverter.float32ToByte(valueArray[i]));
                    } else if(typeArray[i] == "s"){
                        // string
                        byteArray = concatAndAlign(byteArray,byteConverter.stringToByte(valueArray[i]));
                    } else if(typeArray[i] == "h"){
                        // BigInt
                        byteArray = byteArray.concat(byteConverter.int64ToByte(valueArray[i]));
                    }
                }
                return byteArray;
            },
            parseOSCMsg : function(message){
                // initiliaze result & index offset
                var result = {};
                var offset = 0;

                // read in address pattern
                var tempResult = parseAddressPattern(message, offset);

                offset = align(tempResult.index);
                result.address = tempResult.result;

                // read in typeflags
                tempResult = parseTypeFlags(message,offset);

                offset = align(tempResult.index);
                result.typeFlags = tempResult.typeFlags;

                // read in values
                tempResult = parseValues(message,offset,result.typeFlags);

                result.values = tempResult;

                return result;    
            },
        }
    }

    // SINGLETON BEHAVIOUR
    return {
        getInstance : function(){
            if (!instantiated){
                instantiated = init();
            }
            return instantiated; 
        }
    }
})();