const routeguide = require('./planning');
var grpc = require('@grpc/grpc-js');

const server_gRPC = `localhost:${process.env.GRPC_PORT}`;

const client = process.env.GRPC_PORT !== null && process.env.GRPC_PORT !== undefined && process.env.GRPC_PORT > 0 ?
               new routeguide.Planning(server_gRPC, grpc.credentials.createInsecure()) :
               null;

module.exports = client;