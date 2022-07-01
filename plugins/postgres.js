"use strict";

const fp = require('fastify-plugin');

module.exports = fp(async (fastify, opts) => {
  
    const url = `postgres://${fastify.config.POSTGRES_USER}:${fastify.config.POSTGRES_PASSWORD}@${fastify.config.POSTGRES_URL}:${fastify.config.POSTGRES_PORT}/${fastify.config.POSTGRES_DATABASE_NAME}`;
    fastify.register(require('@fastify/postgres'), {
        connectionString: url
    })
    
});
