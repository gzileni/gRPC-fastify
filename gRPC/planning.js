var PROTO_PATH = __dirname + '/planning.proto';
var grpc = require('@grpc/grpc-js');
var protoLoader = require('@grpc/proto-loader');

var packageDefinition = protoLoader.loadSync(
    PROTO_PATH,
    {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true
    }
);

var protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
module.exports = protoDescriptor.planning;