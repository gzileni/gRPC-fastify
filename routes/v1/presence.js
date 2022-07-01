'use strict'
const _ = require('lodash');
const Presence = require('../../models/Presence')

module.exports = async (fastify, opts) => {

    let presence = null;
    let payload = null;

    fastify.addHook('preHandler', (request, reply, done) => {

        if (request.method === 'GET') {

            const p = { 
                where: request.params.presence,
                page: request.query.page ? parseInt(request.query.page) : 0,
                rows: request.query.rows ? parseInt(request.query.rows) : 0
            }

            if (fastify.gRPC.client !== null && fastify.gRPC.client !== undefined) {
                /** gRPC */
                fastify.log.info('boost gRPC ....');
                fastify.gRPC.client.getPresence(p, (error, data) => {
                    
                    if (error) {
                        console.error(error);
                        reply.status(404).error;
                    };

                    presence = data;
                    
                    done();
                });
            } else {

                Presence.get(p).then(result => {
                    presence = result;
                    done();
                }).catch(err => {
                    reply.status(404).send(err)
                })

            }
        } else {

            payload = {
                id: request.params.id ? request.params.id : null,
                presence: request.body.presence
            }

            done();
        }
    });

    /**
     * GET employees status
     */
    fastify.get('/presence', { response: fastify.schemas.response }, async (request, reply) => {
        
        _.forEach(presence.data, item => {
            fastify.resource.link('items', encodeURI(`${request.url}/${item.presence}`));
        })
        
        reply.status(200).send({
            ...presence,
            ...fastify.resource.toJSON()
        });

    });

    fastify.get('/presence/:presence', { response: fastify.schemas.response }, async (request, reply) => {
        reply.status(200).send({
            data: presence,
            ...fastify.resource.toJSON()
        });
    });

    /**
     * POST new status
     */
    fastify.post('/presence', { body: fastify.schemas.bodyPresence }, (request, reply) => {
        
        fastify.payload_events = {
            key: 'presence',
            value: 'new',
        };

        if (fastify.gRPC.client !== null && fastify.gRPC.client !== undefined) {
            fastify.gRPC.client.postPresence(payload, (error, response) => {
                if (error) {
                    reply.status(500).send(error);
                } else {
                    reply.status(201).send(response);
                }
            })
        } else {
            Presence.post(payload).then(response => {
                reply.status(201).send(response)
            }).catch(error => {
                reply.status(500).send(error)
            })
        };
    
    });

    /**
     * PUT update status
     */
    fastify.put('/presence/:id', { body: fastify.schemas.bodyPresence }, (request, reply) => {
        
        fastify.payload_events = {
            key: 'presence',
            value: 'edit',
        };

        if (fastify.gRPC.client !== null && fastify.gRPC.client !== undefined) {
            fastify.gRPC.client.putPresence(payload, (error, response) => {
                if (error) {
                    reply.status(500).send(error);
                } else {
                    reply.status(201).send(response);
                }
            })
        } else {
            Presence.put(payload).then(response => {
                reply.status(201).send(response)
            }).catch(error => {
                reply.status(500).send(error)
            })
        };
    
    });

    /**
     * DELETE status
     */
    fastify.delete('/presence/:id', (request, reply) => {
        fastify.payload_events = {
            key: 'presence',
            value: 'delete',
        }

        if (fastify.gRPC.client !== null && fastify.gRPC.client !== undefined) {
            fastify.gRPC.client.delPresence(payload, (error, response) => {
                if (error) {
                    reply.status(500).send(error);
                } else {
                    reply.status(201).send(response);
                }
            })
        } else {
            Status.del(payload).then(response => {
                reply.status(201).send(response)
            }).catch(error => {
                reply.status(500).send(error)
            })
        };

    });

}
