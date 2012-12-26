var net = require("net")
var crypto = require('crypto')
var BosonWriter = require("./BosonWriter.js").BosonWriter
var BosonReader = require('./BosonReader.js').BosonReader
function BosonClient(host, port) {
    var self = this
    self.callbacks = {}
    self.onConnectCallbacks = []
    self.writeQueue = []
    self.reconnect = true
    self.reconnecting = false
    /**
     * Have a callback function invoked when the client is connected or re-connected
     * @param callback
     */
    self.onConnect = function (callback) {
        if (callback)
            self.onConnectCallbacks.push(callback)
    }
    self.connect = function () {
        self.client = net.createConnection({port:port, host:host})
        //keep these in connect so they're reset with every re/connection
        var tmpBuffer = new Buffer(0)
        var writerIndex = 0
        var readerIndex = 0
        self.client.on('data', function (buffer) {
            if (Buffer.isBuffer(buffer)) {
                //the whole message may not come in a single buffer.
                //create a new buffer with size = tmpBuffer.length + buffer.length
                var tmp = new Buffer(tmpBuffer.length + buffer.length)
                //copy existing content from tmpBuffer into tmp starting from 0
                tmpBuffer.copy(tmp, 0, 0)
                //copy buffer into tmp starting from tmpBuffer.length
                buffer.copy(tmp, tmpBuffer.length, 0)
                //the above basically joins existing buffer with the incoming buffer
                tmpBuffer = tmp
                //if tmp.length > 4
                if (tmpBuffer.length > 4) {
                    //total = read the first 5 bytes, bytes 2-5 is the size of the message
                    var protocolVersion = tmpBuffer.readInt8(0)
                    var total = tmpBuffer.readInt32BE(1)
                    // readerIndex = 5 (6th byte onwards)
                    //if(tmpBuffer.length >= total) then we have a whole message, attempt to de-serialize
                    if (tmpBuffer.length >= total) {
                        //get message 6th byte until total
                        var msg = tmpBuffer.slice(5, 5 + total)
                        //workout how many bytes are left
                        var rem = tmpBuffer.length - (5 + total)
                        var remainder = new Buffer(rem)
                        //copy the remaining bytes into tmpBuffer, it'll be the start of the next message
                        tmpBuffer.copy(remainder, 0, 0, rem)
                        tmpBuffer = remainder
                        //now de-serialize the message
                        //set what's left in tmpBuffer to 0'th index
                        var reader = new BosonReader(msg,protocolVersion,total)
                        reader.deserialize()
                        //console.log(reader)
                        var callback = self.callbacks[reader.method]
                        if (callback) {
                            callback.apply(self, reader.arguments)
                            //delete self.callbacks[msg.topic]
                        }
                    } else {
                        console.log("Whole message not available yet, buffered ", tmpBuffer.length, " bytes")
                    }
                } else {
                    console.log("Really small buffer received. Message size not available yet...")
                }
            } else {
                //invalid object
                console.log('Invalid data received on socket:\n', buffer.toString());
            }
        });
        self.retryConnection = function () {
            self.connected = false
            if (self.reconnect && !self.reconnecting) {
                self.reconnecting = true
                setTimeout(function () {
                    self.reconnecting = false
                    console.log('Attempting reconnect to ' + host + ":" + port);
                    self.connect()
                }, 5000)
            }
        }
        self.client.on('error', function (err) {
            if (err.code == 'ECONNREFUSED') {
                console.log('Connection refused');
                self.retryConnection()
            }
            console.log('client error:', err);
        });
        self.client.on('connect', function () {
            self.connected = true
            console.log('Connected');
            //invoke call onConnect callbacks
            for (var i in self.onConnectCallbacks) {
                self.onConnectCallbacks[i].call(self)
            }
            //empty write queue
            for (var i in self.writeQueue) {
                var obj = self.writeQueue[i]
                self.invoke(obj.method, obj.arguments, obj.callback)
            }
        });
        self.client.on('end', function () {
            self.retryConnection()
            console.log('Server dropped connection');
        });
        self.client.on('close', function () {
            self.retryConnection()
            console.log('Server dropped connection');
        });
    }

    self.invoke = function (method, arguments, callback) {
        if (!self.connected && self.reconnect) {
            self.retryConnection()
        }
        if (self.client.writable) {
            var md5 = crypto.createHash("md5")
            md5.update('' + Math.random())
            var id = md5.digest("hex")
            self.callbacks[id] = function (response) {
                if (callback != undefined || callback != null) {
                    callback(response)
                }
            }
            //http://stackoverflow.com/questions/4775722/javascript-check-if-object-is-array
            //or http://blog.niftysnippets.org/2010/09/say-what.html
            if (!Object.prototype.toString.call(arguments) === '[object Array]') {
                arguments = [arguments] //if its not an array
            }
            var writer = new BosonWriter()
            writer.serializeRequest(method, id, arguments)
            //send
            self.client.write(writer.buffer)
        } else {
            self.writeQueue.push({method:method, arguments:arguments, callback:callback})
            self.retryConnection()
        }
    }
}
exports.BosonClient = BosonClient