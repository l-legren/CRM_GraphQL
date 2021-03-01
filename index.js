const { ApolloServer } = require("apollo-server");
const typeDefs = require("./db/schema");
const resolvers = require("./db/resolvers");
const jwt = require("jsonwebtoken");
require("dotenv").config({ path: "variables.env" });
// Connecting to DB
const connectDB = require("./config/db");

connectDB();
// Server
const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: async ({ req }) => {
        const token = req.headers["authorization"] || "";
        if (token) {
            try {
                const user = await jwt.verify(token, process.env.SECRET);
                console.log("This is user after veryfing token", user);
                return user;
            } catch (error) {
                console.log("Problem veryfing Token", error);
            }
        }
    },
});

// Initialize my server
server.listen().then(({ url }) => {
    console.log(`Server running on ${url}`);
});
