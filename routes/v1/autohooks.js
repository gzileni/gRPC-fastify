const hal = require('hal');

module.exports = async function (fastify, opts) {
  /**
   * 
   */
  fastify.addHook('onRequest', async (request, reply) => {
    fastify.resource = new hal.Resource({name: "TimeReport API"}, `${request.url}`);
    fastify.resource.link('curies', process.env.CURIES);

    if (request.query.page != null && request.query.page != undefined) {
      fastify.resource.link('next', `${request.url}?page=${parseInt(request.query.page) + 1}`);
    }

    if (request.query.page > 1) {
      fastify.resource.link('previous', `${request.url}?page=${parseInt(request.query.page) - 1}`);
    }
    
    fastify.db = await fastify.pg.connect();
  });

};