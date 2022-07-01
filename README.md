# gRPC + Fastify

Spesso ci siamo trovati difronte al problema di come rendere performati i nostri progetti API REST, soprattutto quando le applicazioni client richiedono una mole di dati notevole, come nel caso di grossi gestionali, con query SQL complesse eseguite su un database remoto.

Per risolvere questo problema possiamo considerare le elevate prestazioni di _protocol buffer (Protobuf)_ sviluppato e utilizzato da Google per la comunicazione interna dei propri server per diminuire il tempo di latenza nella risposta dei numerosi microservizi collegati tra di loro.

In questo post aggiungeremo ad un Server REST sviluppato con [Fastify](https://www.fastify.io), un server molto efficiente e decisamente uno dei più veloci framework web, [gRPC](https://grpc.io).

L'archittetura prevede alcuni servizi che ricevono dati da altri microservizi esterni e con una connessione ad un database PostGres remoto.

<center>
<img src="https://github.com/gzileni/gzileni.github.io/raw/master/assets/img/posts/gRPC.jpg" style="width: 50%; margin: 20px;" />
</center>

## Introduzione a gRPC

Innanzitutto facciamo una breve introduzione a **gRPC**, un framework RPC ad utilizzo universale compatibile con diversi linguaggi di programmazione e pensato per ottenere elevate prestazioni grazie al _[protocol buffer](https://developers.google.com/protocol-buffers)_ su HTTP/2 sviluppato da Google che permette di serializzare i dati strutturati, come JSON o XML, tranne per il fatto che gRPC occupa pochissimo spazio ed è molto più veloce. _protocol buffer_ è indipendente dal linguaggio di programmazione ed è definito da un linguaggio di definizione creato nei file _.proto_.

<iframe width="100%" height="480" src="https://www.youtube.com/embed/72mPlAfHIjs" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

## Installazione

Il progetto crea un backend per un semplice planning dei turni di lavoro per i dipendenti:

```bash
git clone https://github.com/gzileni/gRPC-fastify
cd gRPC-fastify
npm install
```

Succesivamente è necessario rinominare il file _.env.template_ in _.env_ e sostituire le variabile di un ambiente con valori per la connessione ad un vostro server PostGres e API esterna.

## gRPC Server  

Nella cartella gRPC ci sono tutti gli script del server e client gRPC, compreso il file .proto di definizione.

_gRPC/planning.proto_

```proto

syntax = "proto3";

package planning;

service Planning {

    /** Employees */
    rpc GetEmployees(Request) returns (Response_Employee) {}
    
    /** Employee Presence */
    rpc GetPresence(Request) returns (Response_Presence) {}
    rpc PostPresence(Presence) returns (Response_CRUD) {}
    rpc PutPresence(Presence) returns (Response_CRUD) {}
    rpc DelPresence(Presence) returns (Response_CRUD) {} 

    /** Vehicles */
    rpc GetPlanning(Request) returns (Response_Planning) {}
    rpc PostPlanning(Planning_Payload) returns (Response_CRUD) {}
    rpc PutPlanning(Planning_Payload) returns (Response_CRUD) {}
    rpc DelPlanning(Planning_Payload) returns (Response_CRUD) {} 

}

message Employee {
    int32 id = 1;
    string name = 2;
    string username = 3;
    string role = 4;
}

message Response_Employee {
    repeated Employee data = 1;
}

message Request {
    optional string token = 1;
    optional string where = 2;
    optional int32 id = 3;
    optional string name = 4;
    optional int32 page = 5;
    optional int32 rows = 6;
}

message Presence {
    int32 id = 1;
    string presence = 2;
}

message Response_Presence {
    repeated Presence data = 1;
}

message Planning_Message {
    int32 id = 1;
    int32 id_employee = 2;
    int32 id_presence = 3;
    string date = 4;
    string employee = 5;
    string presence = 6;
}

message Planning_Payload {
    optional int32 id = 1;
    optional string token = 2;
    string username = 3;
    string presence = 4;
    string date = 5;
}

message Response_Planning {
    repeated Planning_Message data = 1;
}

message Response_CRUD {
    string result = 1;
    string error = 2;
}

```

Nel file di definizione sono definiti i servizi rpc per i metodi POST, PUT, DELETE del Server REST per un classico CRUD. Il file _server.js_ avrà due metodi _start()_ per avviare il server da Fastify e _shutdown()_.

_gRPC/server.js_

```javascript

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

```

mentre il client.js sarà un'istanza creata all'avvio da Fastify connesso al server per eseguire i servizi interni.

_gRPC/client.js_

```javascript
const routeguide = require('./planning');
var grpc = require('@grpc/grpc-js');

const server_gRPC = `localhost:${process.env.GRPC_PORT}`;

const client = process.env.GRPC_PORT !== null 
               && process.env.GRPC_PORT !== undefined 
               && process.env.GRPC_PORT > 0 ?
               new routeguide.Planning(server_gRPC, grpc.credentials.createInsecure()) :
               null;

module.exports = client;
```

Bisogna aggiungere l'avvio del server gRPC insieme ad un'istanza del client tramite [Hook onReady](https://www.fastify.io/docs/latest/Reference/Hooks/#onready) di Fastify, prima che il server Fastify cominci ad ascoltare le richieste dei client, ed eseguire lo shutdown prima della chiusura di Fastify nell'[Hook onClose](https://www.fastify.io/docs/latest/Reference/Hooks/#onclose)

_app.js_

```javascript

  fastify.addHook('onReady', (done) => {

    models.init(fastify.config)

    if (fastify.config.GRPC_PORT !== null 
        && fastify.config.GRPC_PORT !== undefined 
        && parseInt(fastify.config.GRPC_PORT) !== 0) {
        
        /** start server gRPC */
        fastify.gRPC.server.start(fastify.config);
        fastify.log.info(`Server gRPC started on PORT ${fastify.config.GRPC_SERVER}:${fastify.config.GRPC_PORT}`);

        /** create client gRPC */
        if (fastify.gRPC.client !== null && fastify.gRPC.client !== undefined) {
            fastify.gRPC.client.waitForReady(Infinity, (err) => {
                fastify.log.info(err !== null && err !== undefined ? 
                                 err : 
                                 `Client connected to gRPC Server ${fastify.config.GRPC_SERVER}:${fastify.config.GRPC_PORT}`);
            })
        };

    };

    done();
  });

  fastify.addHook('onClose', async () => {
    /** stop gRPC server */
    fastify.log.info(`shutdown gRPC Server ${fastify.config.GRPC_SERVER}:${fastify.config.GRPC_PORT}`);
    if (fastify.gRPC.server !== null && fastify.gRPC.server !== undefined) {
      fastify.gRPC.client.close();
      await fastify.gRPC.server.shutdown();
    }
  });


```

il progetto prevede la possibilità di non avviare il server gRPC, basterà impostare la variabile di ambiente GRPC_PORT a 0. Anche il routing del server dovrà prevedere entrambe le possibilità, ad esempio avremo endpoints per inserire, modificare e cancellare il tipo di presenza del dipendente, e per il planning come questi:

_routes/v1/planning.js_

```javascript
'use strict'
const _ = require('lodash');
const Planning = require('../../models/Planning');

module.exports = async (fastify, opts) => {

    let planning = null;
    let payload = null;

    fastify.addHook('preHandler', (request, reply, done) => {

        if (request.method === 'GET') {

            const p = {
                token: request.user.token,
                where: request.params.username,
                page: request.query.page,
                rows: request.query.rows
            };

            if (fastify.gRPC.client !== null && fastify.gRPC.client !== undefined) {
                fastify.gRPC.client.getPlanning(p, (error, response) => {

                    if (error) {
                        fastify.log.error(error);
                        reply.status(500).send(error);
                    } else {
                        planning = response;
                        done();
                    }
                })
            } else {
                Planning.get(p).then(response => {
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

```

Il repository completo è disponibile [qui](https://github.com/gzileni/gRPC-fastify), insieme alle configurazioni per avviare un container Docker.

Infine avviate il server con i comandi:

```javascript
npm start
```

or 

```
npm run dev
```

<center>
<img src="/assets/img/posts/gRPC2.png](https://github.com/gzileni/gzileni.github.io/raw/master/assets/img/posts/gRPC2.png" style="width: 100%; margin: 20px;" />
</center>


