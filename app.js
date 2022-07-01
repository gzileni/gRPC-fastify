"use strict";

const path = require('path')
const AutoLoad = require('@fastify/autoload');
const env = require('@fastify/env');
const models = require('./models')

module.exports = async (fastify, opts) => {
  
  fastify.decorate("resource", null);
  fastify.decorate("gRPC", require('./gRPC'));
  fastify.decorate("schemas", require('./schemas'));
  
  const schema = {
    type: 'object',
    required: [ 'POSTGRES_DATABASE_NAME', 'POSTGRES_URL', 'POSTGRES_PORT', 'POSTGRES_USER', 'POSTGRES_PASSWORD', 'SECRET', 'API' ],
    properties: {
      POSTGRES_DATABASE_NAME: {
          type: 'string'
      },
      POSTGRES_URL: {
          type: 'string'
      },
      POSTGRES_PORT: {
          type: 'string',
          default: '5432'
      },
      POSTGRES_USER: {
          type: 'string'
      },
      POSTGRES_PASSWORD: {
          type: 'string'
      },
      SECRET: {
          type: 'string'
      },
      API: {
        type: 'string'
      },
      GRPC_SERVER: {
        type: 'string',
        default: '0.0.0.0'
      },
      GRPC_PORT: {
        type: 'string',
        default: '50051'
      },
      CURIES: {
        type: 'string'
      }
    }
  }

  const options = {
      schema: schema,
      data: process.env,
      dotenv: true
  };

  fastify.register(env, options).after((err) => {
    if (err) console.error(err);

    if (process.env.SERVER === 'docker') {
      const newConfig = {
        POSTGRES_DATABASE_NAME: process.env.POSTGRES_DATABASE_NAME,
        POSTGRES_URL: process.env.POSTGRES_URL, 
        POSTGRES_PORT: process.env.POSTGRES_PORT, 
        POSTGRES_USER: process.env.POSTGRES_USER, 
        POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD
      };

      fastify.config = {
        ...newConfig
      }

    };

  });

  /**
   * 
   */
  fastify.addHook('onReady', (done) => {

    models.init(fastify.config)

    /** start server gRPC */
    if (fastify.config.GRPC_PORT !== null && fastify.config.GRPC_PORT !== undefined && parseInt(fastify.config.GRPC_PORT) !== 0) {
      fastify.gRPC.server.start(fastify.config);
      fastify.log.info(`Server gRPC started on PORT ${fastify.config.GRPC_SERVER}:${fastify.config.GRPC_PORT}`);
      if (fastify.gRPC.client !== null && fastify.gRPC.client !== undefined) {
        fastify.gRPC.client.waitForReady(Infinity, (err) => {
          fastify.log.info(err !== null && err !== undefined ? err : `Client connected to gRPC Server ${fastify.config.GRPC_SERVER}:${fastify.config.GRPC_PORT}`);
        })
      }
    };

    done();
  });

  /**
   * 
   */
  fastify.addHook('onClose', async () => {
    /** stop gRPC server */
    fastify.log.info(`shutdown gRPC Server ${fastify.config.GRPC_SERVER}:${fastify.config.GRPC_PORT}`);
    if (fastify.gRPC.server !== null && fastify.gRPC.server !== undefined) {
      fastify.gRPC.client.close();
      await fastify.gRPC.server.shutdown();
    }
  });

  /**
   * This loads all plugins defined in plugins
   */
  fastify.register(AutoLoad, {
    dir: path.join(__dirname, "plugins"),
    options: Object.assign({}, opts),
  });

  /**
   * This loads all plugins defined in routes
   */
  fastify.register(AutoLoad, {
    dir: path.join(__dirname, "routes/v1"),
    autoHooks: true,
    options: {
      ...opts,
      prefix: "/v1",
    },
  });

};
