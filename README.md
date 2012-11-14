# higgs-node

## Higgs Boson - Node JS

Node JS implementation of the [Boson](https://github.com/zcourts/higgs/tree/master/src/main/scala/info/crlog/higgs/protocols/boson) protocol.

It allows for communication between any Boson server implementation from JavaScript.

# Example

The example below users the server example found in the [Scala demo](https://github.com/zcourts/higgs/blob/master/src/main/scala/info/crlog/higgs/protocols/boson/demo/DemoServer.scala)

1. Start the Scala server
2. Run the example below

```javascript

var higgs = require("./higgs.js")
var client = new higgs.BosonClient("localhost", 12001)
client.connect()

for (var i = 0; i < 1000; i++)
    client.invoke('nodejs', [
        1.2, 1, null,
        {a:1, v:12345},
        [1, 2, 3],
        true, "test"
    ], function (a) {
        console.log(a)
    })


```

### Output

```javascript
[ 1.2000000476837158,
  1,
  null,
  { a: 1, v: 12345 },
  [ 1, 2, 3 ],
  true,
  'test' ]
...
```
Protocol and Deviation from the specs
-------------------------------------

+ JavaScript is powerful but limited in its own way, some of the data types the Boson protocol
supports are not supported in JavaScript. Where possible, JavaScript equivalents are used.

## Longs

JavaScript does not support longs. When de-serializing the 64 bits that would have otherwise
been the entire contents of a long value are taken and broken into "high" and "low" bits.

+ The "high" bits (left most 32 bits of the 64 bits) are discarded
+ The "low" bits are then treated as an integer and returned. This means if a long value is
received that cannot fit into 32 bits it won't give what you expect.
+ If Longs must be sent to the Node JS client then send it as a string!
+ I've considered doing something similar to [mongo](https://github.com/mongodb/js-bson/blob/master/lib/bson/long.js)
but it seems over kill if its not absolutely required. Open to suggestions on how to handle it.

## Floats & Doubles

No matter what you try, no matter how much you yell floats are the only supported types
__WHEN SENDING__, the server can send doubles back and they will be handled as expected.
So on the server, don't expect Node JS to send a double, it'll always send a float.

It is possible for Node JS to send Doubles but to do that you'd have to be able to differentiate
between a float and a double. Not found a sensible way to do that.


## Maps & POLOs

A POLO is Boson's way of allowing a statically typed language such as Java/Scala to send
 any of its types. JavaScript doesn't really have static types and on most days everything
 is an "object".
+ When the Node JS client receives a POLO it creates a JavaScript hash/map from it.
 In that hash, the keys are the variable names and the values are what were the values of the
 variable when the POLO was serialized.

## Arrays & Lists

+ Practically the only difference between an array and a list is that arrays are ordered
and lists aren't. When the client receives a list it just de-serializes it into a JavaScript array.

# Server

+ TODO - Only a Boson client is implemented in JavaScript so far. It allows you to invoke methods on a Boson
server and receive whatever response that method returned.