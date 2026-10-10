// Modified for RustRelay on 2026-10-10.
const path = require('node:path');
let host;
module.exports = {
 configure(value) { host = value; },
 resolve(name) { return path.join(host.directory, name); },
 read(collection, id) { return host.read(collection, id); },
 write(collection, id, value) { host.write(collection, id, value); },
 keys(collection) { return host.keys(collection); },
 log(title, message, level) { host.log(title, message, level); },
};
