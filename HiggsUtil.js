//http://stackoverflow.com/a/7390555/400048
var TYPES = {
        'undefined':'undefined',
        'number':'number',
        'boolean':'boolean',
        'string':'string',
        '[object Function]':'function',
        '[object RegExp]':'regexp',
        '[object Array]':'array',
        '[object Date]':'date',
        '[object Error]':'error'
    },
    TOSTRING = Object.prototype.toString;
//https://github.com/kvz/phpjs/blob/master/functions/var/is_float.js
function is_float(mixed_var) {
    return +mixed_var === mixed_var && (!isFinite(mixed_var) || !!(mixed_var % 1));
}
function type(o) {
    if (is_float(o)) {
        return 'float'
    }
    return TYPES[typeof o] || TYPES[TOSTRING.call(o)] || (o ? 'object' : 'null');
}
exports.type = type