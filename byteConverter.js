var ByteConverter = (function(){
    var instantiated;

    function init(){
        var ZERO = 0;

        function int32BitToByte(value){
            var array = [];
            for(var j = 3; j >= 0; --j){
                temp = (value & 255);
                value = value >> 8;
                array[j] = temp;
            }
            return array;
        }

        function int32BitFromByte(message,offset){
            var result = 0;
            for (var i = offset; i < offset + 4;i++){        
                result += message[i];       
                if (i < offset + 3) {
                    result = result << 8;
                }
            }
            return result;
        }

        function float_to_bits(f){
            var sign_bit = (f < 0) ? 1 : 0;
            var exp_temp = 0;
            var exponent = 0;
            var mantissa = 0;
            var man_temp = 0;
            var bits_as_int = 0;
            
            f = Math.abs(f);
            
            if (f >= 1) {
                exp_temp = Math.log(f) / Math.log(2);
                exp_temp = Math.floor(exp_temp);
            } else {
                exp_temp = Math.log(1/f) / Math.log(2);
                exp_temp = - Math.floor(exp_temp);
            }
            
            exponent = exp_temp + 127;
            man_temp = f * (1 << (23 - exp_temp));
            mantissa = Math.floor(man_temp);
            
            bits_as_int = (sign_bit << 31) |(exponent << 23)| (mantissa & ((1 << 23) - 1));

            return bits_as_int;
        }

        function parseFloat(bytes) {

            var binary = "";
            var bits;
            for(var i = 0; i < 4; i++) {
                bits = bytes[i].toString(2);
                while (bits.length < 8){ 
                    bits = "0" + bits;
                }
                binary += bits;
            }

            var sign = (binary.charAt(0) == '1')?-1:1;
            var exponent = parseInt(binary.substr(1,8),2) - 127;
            var significandBase = binary.substr(1+8,23);
            var significandBin = '1'+significandBase;
            var i = 0;
            var val = 1;
            var significand = 0;

            if (exponent == -127){
              if (significandBase.indexOf('1') == -1){
                  return 0;
              }else{
                  exponent = -126;
                  significandBin = '0'+significandBase;
              }
            }

            while (i < significandBin.length) {
              significand += val * parseInt(significandBin.charAt(i));
              val = val / 2;
              i++;
            }

            return sign * significand * Math.pow(2, exponent);
        }

        // PUBLIC FUNCTIONS
        return{

            stringToByte : function(string){
                var array = [];
                for(var i = 0; i < string.length; i++){
                    array.push(string.charCodeAt(i));
                }
                return array;
            },
            int32ToByte : function(value){
                return int32BitToByte(value);
            },
            int64ToByte : function(number){
                var result = int32BitToByte(number.highWord);
                result = result.concat(int32BitToByte(number.lowWord));

                return result;
            },
            float32ToByte : function(value){
                return int32BitToByte(float_to_bits(value));
            },
            stringFromBytes : function(message,offset){
                var result = "";
                var currentChar = -1;

                while(currentChar != ZERO){
                    result += String.fromCharCode(message[offset]);
                    offset += 1;
                    currentChar = message[offset];
                }
                return {"result" : result, "index" : offset};
            },
            int32FromBytes : function(message,offset){
                return int32BitFromByte(message,offset);
            },
            int64FromBytes : function(message,offset){
                if(offset == undefined){
                    offset = 0;
                }
                var result = new BigInt();

                result.highWord = int32BitFromByte(message,offset);
                result.lowWord =  int32BitFromByte(message,offset + 4); // CHECK INDEX!

                return result;
            },
            float32FromBytes : function(array,offset){
                return parseFloat(array.slice(offset,offset+4));
            }
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