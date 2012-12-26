var higgs = require("./higgs.js")
//var client = new higgs.BosonClient("localhost", 12001)
//client.connect()
//client.onConnect(function () {
//    //invoke 10 times
//    for (var i = 0; i < 10; i++) {
//        client.invoke('nodejs', [
//            1.2, i, null,
//            {a:1, v:12345*i},
//            [i,1, 2, 3],
//            true, "test"
//        ], function (a) {
//            console.log(a)
//        })
//    }
//})
var client = new higgs.BosonClient("localhost", 11000)
client.connect()
client.onConnect(function () {
    client.invoke('circular', [], function (a) {
        console.log(a)
    })
})