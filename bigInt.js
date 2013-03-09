var fill = ["","0","00","000","0000","00000","0000000","0000000"]; // used for hex printing

var BigInt = function(){
	this.highWord = 0;
	this.lowWord = 0;
};

BigInt.prototype.toString = function(){
	var string = this.highWord + ":" + this.lowWord;
	return string;
};

BigInt.prototype.toHex = function(){
	var highHex = this.highWord.toString(16);
	var lowHex = this.lowWord.toString(16);

	return "0x" + fill[8 - highHex.length] + highHex + fill[8 - lowHex.length] + lowHex;
};

BigInt.prototype.isEqual = function(number){
	if(number.highWord == this.highWord && number.lowWord == this.lowWord){
		return true;
	}
	return false;
};

