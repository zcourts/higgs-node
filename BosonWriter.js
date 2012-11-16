var util = require("./HiggsUtil.js")
var BosonType = require('./BosonType.js').BosonType
function BosonWriter() {
    var self = this
    self.buffer = new Buffer(0)
    /**
     * Append the contents of the given buffer to self.buffer
     * @param buf
     */
    self.appendBuffer = function (buf) {
        if (Buffer.isBuffer(buf)) {
            self.buffer = Buffer.concat([self.buffer, buf])
        }
    }
    /**
     * Serialize a request according to the Boson protocol specification
     * @see https://github.com/zcourts/higgs/tree/master/src/main/scala/info/crlog/higgs/protocols/boson
     * @param method
     * @param callbackID
     * @param arguments
     */
    self.serializeRequest = function (method, callbackID, arguments) {
        //write the method name
        self.writeBosonType(BosonType.REQUEST_METHOD_NAME)
        self.writeString(method)
        //write the callback name
        self.writeBosonType(BosonType.REQUEST_CALLBACK)
        self.writeString(callbackID)
        //write the parameters
        self.writeBosonType(BosonType.REQUEST_PARAMETERS)
        self.writeArray(arguments)
        //self.buffer now contains the serialized message but protocol version and
        // message size is missing since size can't be determined until the end
        // so build new buffer with size and protocol
        var msg = self.buffer
        var protocolAndSize = new Buffer(5)
        protocolAndSize.writeInt8(1, 0) //version 1 protocol, buffer index 0
        protocolAndSize.writeInt32BE(msg.length, 1) //message size, buffer index 1
        //now assign a complete buffer with protocol,size and message
        self.buffer = Buffer.concat([protocolAndSize, msg])
    }
    //only needed for server
    self.serializeResponse = function () {
        throw new Error("Unsupported Operation. Writing responses not yet supported")
    }
    self.writeDataType = function (arg) {
        switch (util.type(arg)) {
            case 'float':
                self.writeFloat(arg)
                break;
            case 'number':
                self.writeInt(arg)
                break;
            case 'boolean':
                self.writeBoolean(arg)
                break;
            case 'null':
                self.writeNull()
                break;
            case 'string':
                self.writeString(arg)
                break;
            case 'array':
                self.writeArray(arg)
                break;
            case 'object':
                self.writeMap(arg)
                break;
            default :
                if (arg === undefined) {
                    self.writeNull()
                } else {
                    throw new Error("Unsupported type. Unable to serialize object")
                }
        }
    }
    self.writeFloat = function (arg) {
        self.writeBosonType(BosonType.FLOAT)
        //32 bit float = 4 bytes/octets
        var buf = new Buffer(4)
        //write big endian float
        buf.writeFloatBE(arg, 0)
        self.appendBuffer(buf)
    }
    self.writeInt = function (arg) {
        self.writeBosonType(BosonType.INT)
        //32 bit int = 4 bytes/octets
        var buf = new Buffer(4)
        //write big endian int
        buf.writeInt32BE(arg, 0)
        self.appendBuffer(buf)
    }
    self.writeBoolean = function (arg) {
        //write type
        self.writeBosonType(BosonType.BOOLEAN)
        //1 byte for value if 1 then true else false
        var bool = 0
        if (arg) {
            bool = 1
        }
        var buf = new Buffer(1)
        //write value
        buf.writeInt8(bool, 0)
        self.appendBuffer(buf)
    }
    self.writeNull = function () {
        self.writeBosonType(BosonType.NULL)
    }
    self.writeString = function (arg) {
        var str = new Buffer(arg, 'utf8')
        var typeAndSize = new Buffer(5)
        //write type - 8 bits/1 byte int
        typeAndSize.writeInt8(BosonType.STRING, 0)
        //write size - how many bytes in are in the string
        typeAndSize.writeInt32BE(str.length, 1)
        var buf = Buffer.concat([typeAndSize, str])
        self.appendBuffer(buf)
    }
    self.writeArray = function (arguments) {
        self.writeBosonType(BosonType.ARRAY)
        var size = new Buffer(4)
        //write how many items are in the array
        size.writeInt32BE(arguments.length, 0)
        self.appendBuffer(size)
        for (var i in arguments) {
            self.writeDataType(arguments[i])
        }
    }
    self.writeMap = function (obj) {
        self.writeBosonType(BosonType.MAP)
        var size = new Buffer(4)
        //write how many items are in the map
        size.writeInt32BE(Object.keys(obj).length, 0)
        self.appendBuffer(size)
        for (var key in obj) {
            var value = obj[key]
            //write key
            self.writeDataType(key)
            //write value
            self.writeDataType(value)
        }
    }
    self.writeBosonType = function (type) {
        var buf = new Buffer(1)
        //write type - type is 1 byte/octet
        buf.writeInt8(type, 0)
        self.appendBuffer(buf)
    }
}
exports.BosonWriter = BosonWriter