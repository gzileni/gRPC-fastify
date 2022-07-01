'use strict'
const _ = require('lodash');
const Planning = require('../../models/Planning');

module.exports = async (fastify, opts) => {

    let planning = null;
    let payload = null;

    fastify.addHook('preHandler', (request, reply, done) => {

        if (request.method === 'GET') {
            if (fastify.gRPC.client !== null && fastify.gRPC.client !== undefined) {
                fastify.gRPC.client.getPlanning({
                    token: request.user.token,
                    where: request.params.username,
                    page: request.query.page,
                    rows: request.query.rows
                }, (error, response) => {

                    if (error) {
                        fastify.log.error(error);
                        reply.status(500).send(error);
                    } else {
                        planning = response;
                        done();
                    }
                })
            } else {
                Planning.get(request.user.token, request.params.username, request.query.page, request.query.rows).then(response => {
                    planning = response;
                    done();
                }).catch(error => {
                    fastify.log.error(error);
                    reply.status(500).send(error);
                })
            }
        } else {

            payload = {
                id: request.params.id ? request.params.id : null,
                token: request.user.token,
                username: request.body.username,
                presence: request.body.presence,
                date: request.body.date
            }

            done();
        }
    });

    /**
     * GET employees status
     */
    fastify.get('/planning', { response: fastify.schemas.response }, (request, reply) => {

        _.forEach(planning.data, item => {
            fastify.resource.link('items', encodeURI(`${request.url}/${item.username}`));
        });

        reply.status(200).send({
            ...planning,
            ...fastify.resource.toJSON()
        })

    });

    /**
     * 
     */
    fastify.get('/planning/:username', { response: fastify.schemas.response }, (request, reply) => {

        reply.status(200).send({
            ...planning,
            ...fastify.resource.toJSON()
        })

    });

    /**
     * POST new status
     */
    fastify.post('/planning', { body: fastify.schemas.bodyPlanning }, (request, reply) => {
        
        fastify.payload_events = {
            key: 'presence',
            value: 'new',
        };

        if (fastify.gRPC.client !== null && fastify.gRPC.client !== undefined) {
            fastify.gRPC.client.postPlanning(payload, (error, response) => {
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
    fastify.put('/planning/:id', { body: fastify.schemas.bodyPlanning }, (request, reply) => {
        
        fastify.payload_events = {
            key: 'presence',
            value: 'edit',
        };

        if (fastify.gRPC.client !== null && fastify.gRPC.client !== undefined) {
            fastify.gRPC.client.putPlanning(payload, (error, response) => {
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
    fastify.delete('/planning/:id', (request, reply) => {
        fastify.payload_events = {
            key: 'presence',
            value: 'delete',
        }

        if (fastify.gRPC.client !== null && fastify.gRPC.client !== undefined) {
            fastify.gRPC.client.delPlanning(payload, (error, response) => {
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
