const routeguide = require('./planning');
const models = require('../models');
const api = require('../api');
const grpc = require('@grpc/grpc-js');

var server = null;

/** start gRPC Services */
const start = (environments) => {

  const server_url = `${environments.GRPC_SERVER}:${environments.GRPC_PORT}`;
  
  server = new grpc.Server();

  const services = {
    getPresence: models.Presence.get_gRPC,
    postPresence: models.Presence.post_gRPC,
    putPresence: models.Presence.put_gRPC,
    delPresence: models.Presence.del_gRPC,
    getPlanning: models.Planning.get_gRPC,
    postPlanning: models.Planning.post_gRPC,
    putPlanning: models.Planning.put_gRPC,
    delPlanning: models.Planning.del_gRPC,
    getEmployees: api.getEmployees_gRPC,
  }

  server.addService(routeguide.Planning.service, services);
  server.bindAsync(server_url, grpc.ServerCredentials.createInsecure(), () => {
    server.start();
  });

}

/**
 * Shutdows gRPC Server
 */
const shutdown = async () => {
  await server.forceShutdown();
}

module.exports = {
  start,
  shutdown
}