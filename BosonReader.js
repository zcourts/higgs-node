var BosonType = require("./BosonType.js").BosonType
function BosonReader(buffer) {
    var self = this
    self.readerIndex = 0
    self.readByte = function () {
        //read byte from the current reader index then advance index by 1
        return buffer.readInt8(self.readerIndex++)
    }
    self.readShort = function () {
        var i = buffer.readInt16BE(self.readerIndex)
        //advance reader index by 2 bytes
        self.readerIndex += 2
        return i
    }
    self.readInt = function () {
        var i = buffer.readInt32BE(self.readerIndex)
        //advance reader index by 4 bytes
        self.readerIndex += 4
        return i
    }
    /**
     * JS doesn't support Longs :-) but Java etc will still encode as a
     * 64 bit value.
     * Could do something like https://github.com/mongodb/js-bson/blob/master/lib/bson/long.js
     * but is it worth it?
     * @return {*}
     */
    self.readLong = function () {
        var high = self.readInt()
        var low = self.readInt()
        return low
    }
    self.readFloat = function () {
        var i = buffer.readFloatBE(self.readerIndex)
        //advance reader index by 4 bytes
        self.readerIndex += 4
        return i
    }
    self.readDouble = function () {
        var i = buffer.readDoubleBE(self.readerIndex)
        //advance reader index by 8 bytes
        self.readerIndex += 8
        return i
    }
    self.readBoolean = function () {
        var bool = self.readByte()
        return bool == 1 ? true : false
    }
    self.readChar = function () {
        var short = self.readShort()
        var buf = new Buffer(16)
        buf.readInt16BE(short, 0)
        return buf.toString('utf8', 0, buf.length)
    }
    self.readNull = function () {
        return null
    }
    self.readString = function () {
        var size = self.readInt()
        var strBuf = buffer.slice(self.readerIndex, self.readerIndex + size)
        var str = strBuf.toString('utf8', 0, strBuf.length)
        //advance reader index by how many bytes were just read
        self.readerIndex += strBuf.length
        return str
    }
    self.readArray = function () {
        //NOTE: using self.read* methods advances reader index so no need to do it in here
        var size = self.readInt()
        var arr = []
        for (var i = 0; i < size; i++) {
            //get the type of this element in the array
            var type = self.readByte()
            var obj = self.readBosonDataType(type)
            arr.push(obj)
        }
        return arr
    }
    self.readMap = function () {
        //NOTE: using self.read* methods advances reader index so no need to do it in here
        var size = self.readInt()
        var hash = {}
        for (var i = 0; i < size; i++) {
            //get the type of this element's key
            var keyType = self.readByte()
            var key = self.readBosonDataType(keyType)
            //get the type of this element's value
            var valueType = self.readByte()
            var value = self.readBosonDataType(valueType)
            hash[key] = value
        }
        return hash
    }
    self.protocol = self.readByte() //first byte = protocol version
    self.size = self.readInt() //first 4 bytes = int size of message
    self.method = ""
    self.callback = ""
    self.arguments = []
    self.deserialize = function () {
        //var msg = buffer.toString('utf8', self.readerIndex, self.size).trim()
        //console.log(self.protocol, self.readerIndex, self.size, buffer.length, msg.length, msg)
        while (self.readerIndex < buffer.length) {
            var type = self.readByte()
//explicitly get type in switch statement because the read* method
//do not read the byte which specifies their type information
            switch (type) {
                case BosonType.RESPONSE_METHOD_NAME:
                    var type = self.readByte()
                    self.method = self.readString()
                    break;
                case BosonType.RESPONSE_PARAMETERS:
                    var type = self.readByte()
                    self.arguments = self.readArray()
                    break;
                case BosonType.REQUEST_METHOD_NAME:
                    var type = self.readByte()
                    self.method = self.readString()
                    break;
                case BosonType.REQUEST_CALLBACK:
                    var type = self.readByte()
                    self.callback = self.readString()
                    break;
                case BosonType.REQUEST_PARAMETERS:
                    var type = self.readByte()
                    self.arguments = self.readArray()
                    break;
            }
        }
    }
    self.readBosonDataType = function (type) {
        switch (type) {
            case BosonType.BYTE:
                return self.readByte()
            case BosonType.SHORT:
                return self.readShort()
            case BosonType.INT:
                return self.readInt()
            case BosonType.LONG:
                return self.readLong()
            case BosonType.FLOAT:
                return self.readFloat()
            case BosonType.DOUBLE:
                return self.readDouble()
            case BosonType.BOOLEAN:
                return self.readBoolean()
            case BosonType.CHAR:
                return self.readChar()
            case BosonType.NULL:
                return self.readNull()
            case BosonType.STRING:
                return self.readString()
            case BosonType.ARRAY:
                return self.readArray()
            case BosonType.LIST:
                //come on its java script, list, array...all the same
                return self.readArray()
            case BosonType.MAP:
                return self.readMap()
            case BosonType.POLO:
                // :-) again...map, object...one and the same
                return self.readMap()
        }
    }
}
exports.BosonReader = BosonReader