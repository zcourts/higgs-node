/**
 * A set of Boson data types as given in the specs at
 * @see <a href="https://github.com/zcourts/higgs/tree/master/src/main/scala/info/crlog/higgs/protocols/boson">Boson spec</a>
 * @type {Object}
 */
var BosonType = {
    BYTE:1,
    SHORT:2,
    INT:3,
    LONG:4,
    FLOAT:5,
    DOUBLE:6,
    BOOLEAN:7,
    CHAR:8,
    NULL:9,
    STRING:10,
    ARRAY:11,
    LIST:12,
    MAP:13,
    POLO:14,
    REFERENCE:15,
    //request response flags,
    REQUEST_METHOD_NAME:-127,
    REQUEST_PARAMETERS:-126,
    REQUEST_CALLBACK:-125,
    RESPONSE_METHOD_NAME:-124,
    RESPONSE_PARAMETERS:-123

}
exports.BosonType = BosonType