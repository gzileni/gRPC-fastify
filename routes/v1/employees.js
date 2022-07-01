'use strict'
const _ = require('lodash');
const api = require('../../api');

module.exports = async (fastify, opts) => {

    let employees = null;

    fastify.addHook('preHandler', (request, reply, done) => {
        if (request.method === 'GET') {

            const payload = {
                token: request.user.token,
                where: request.params.username,
                page: request.query.page,
                rows: request.query.rows
            }

            if (fastify.gRPC.client !== null && fastify.gRPC.client !== undefined) {
                fastify.gRPC.client.getEmployees(payload, (error, response) => {

                    if (error) {
                        fastify.log.error(error);
                        reply.status(500).send(error);
                    } else {
                        employees = response;
                        done();
                    }
                })
            } else {
                api.getEmployees(payload).then(response => {
                    employees = response;
                    done();
                }).catch(error => {
                    fastify.log.error(error);
                    reply.status(500).send(error);
                })
            }
        }
    });

    /**
     * GET employees status
     */
    fastify.get('/employees', { response: fastify.schemas.response }, (request, reply) => {

        _.forEach(employees.data, item => {
            fastify.resource.link('items', encodeURI(`${request.url}/${item.username}`));
        });

        reply.status(200).send({
            ...employees,
            ...fastify.resource.toJSON()
        })
    });

    /**
     * 
     */
    fastify.get('/employees/:username', { response: fastify.schemas.response }, (request, reply) => {

        reply.status(200).send({
            ...employees,
            ...fastify.resource.toJSON()
        })

    });

}
