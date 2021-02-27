const { ApolloServer } = require("apollo-server");
const typeDefs = require("./db/schema");
const resolvers = require("./db/resolvers");

// Connecting to DB
const connectDB = require("./config/db");

connectDB();
// Server
const server = new ApolloServer({
    typeDefs,
    resolvers,
});

// Initialize my server
server.listen().then(({ url }) => {
    console.log(`Server running on ${url}`);
});
