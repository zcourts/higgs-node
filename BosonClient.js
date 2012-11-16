var net = require("net")
var crypto = require('crypto')
var BosonWriter = require("./BosonWriter.js").BosonWriter
var BosonReader = require('./BosonReader.js').BosonReader
function BosonClient(host, port) {
    var self = this
    self.callbacks = {}
    self.onConnectCallbacks = []
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
        self.client.on('data', function (buffer) {
            if (Buffer.isBuffer(buffer)) {
                var reader = new BosonReader(buffer)
                reader.deserialize()
                //console.log(reader)
                var callback = self.callbacks[reader.method]
                if (callback) {
                    callback.apply(self, reader.arguments)
                    //delete self.callbacks[msg.topic]
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
                    self.client = self.connect()
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
        });
        self.client.on('end', function () {
            self.retryConnection()
            console.log('Server dropped connection');
        });
    }

    self.invoke = function (method, arguments, callback) {
        if (!self.connected && self.reconnect) {
            self.retryConnection()
        }
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
    }
}
exports.BosonClient = BosonClient