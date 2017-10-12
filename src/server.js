import hapi from 'hapi';
import { graphqlHapi, graphiqlHapi } from 'apollo-server-hapi';
import { buildSchema } from 'graphql';

const server = new hapi.Server();

const HOST = 'localhost';
const PORT = 3000;

var schema = buildSchema(`
type Query {
  hello: String
  rollDice(numDice: Int!, numSides: Int): [Int]
}
`);

// The root provides a resolver function for each API endpoint
var root = {
    hello: () => {
        return 'Hello world!';
    },
    rollDice: function({numDice, numSides}) {
        let output = [];
        for(let i=0; i<numDice; i++) {
            output.push(1 + Math.floor(Math.random() * (numSides || 6)));
        }
        return output;
    },
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