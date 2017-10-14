import hapi from 'hapi';
import { graphqlHapi, graphiqlHapi } from 'apollo-server-hapi';
import { buildSchema } from 'graphql';
//import mysql from 'mysql';
import mysql from 'mysql2'
import dotenv from 'dotenv';

const config = dotenv.config(); // load process.env with values in .env

const server = new hapi.Server();

const HOST = process.env.DEV_SERVER_HOST;
const PORT = process.env.DEV_SERVER_PORT;

const DATABASE_HOST = process.env.DEV_DATABASE_HOST;
const DATABASE_USER = process.env.DEV_DATABASE_USER;
const DATABASE_PASSWORD = process.env.DEV_DATABASE_PASSWORD;
const DATABASE_NAME = process.env.DEV_DATABASE_NAME;

var schema = buildSchema(`
type User {
    id: Int
    username: String
    email: String
}

type Query {
  hello: String
  rollDice(numDice: Int!, numSides: Int): [Int]
  solution: Int
  users: [User]
}
`);

var pool = mysql.createPoolPromise({
    host: DATABASE_HOST,
    user: DATABASE_USER,
    password: DATABASE_PASSWORD,
    database: DATABASE_NAME
});


// The root provides a resolver function for each API endpoint
var root = {
    hello: () => {
        console.log('hello?');
        return 'Hello world!';
    },
    rollDice: function({numDice, numSides}) {
        let output = [];
        for(let i=0; i<numDice; i++) {
            output.push(1 + Math.floor(Math.random() * (numSides || 6)));
        }
        return output;
    },
    solution: () => {

        return pool.getConnection().then((conn) => {
            const result = conn.query('SELECT 1 + 1 AS solution');
            conn.release();
            return result;
        }).then((result) => {
            console.log('query complete', result[0][0].solution);
            return result[0][0].solution;
        })


    },
    users: () => {
        return pool.getConnection().then(conn => {
            const result = conn.query('SELECT * FROM users');
            conn.release();
            return result;
        }).then(result => {
            console.log('user query complete', result);
            return result[0];
        })
    }
};

server.connection({
    host: HOST,
    port: PORT,
});

//register hapi plugins

server.register([
    {
        //main apollo server plugin
        register: graphqlHapi,
        options: {
            path: '/graphql',
            graphqlOptions: {
                schema: schema,
                rootValue: root
            },
            route: {
                cors: true
            }
        }
    },
    {
        //graphiql apollo plugin (for dev)
        register: graphiqlHapi,
        options: {
          path: '/graphiql',
          graphiqlOptions: {
            endpointURL: '/graphql',
          }
        }
    }
    //TODO: add logging with 'good'
]);

server.start((err) => {
    if (err) {
        throw err;
    }
    console.log(`Server running at: ${server.info.uri}`);
});