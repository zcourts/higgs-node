var higgs = require("./higgs.js")
var client = new higgs.BosonClient("localhost", 12001)
client.connect()
//invoke 1k times
for (var i = 0; i < 1000; i++) {
    client.invoke('nodejs', [
        1.2, 1, null,
        {a:1, v:12345},
        [1, 2, 3],
        true, "test"
    ], function (a) {
        console.log(a)
    })
}