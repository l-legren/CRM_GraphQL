const { gql } = require("apollo-server")

// SCHEMA 

const typeDefs = gql`

    type User {
        id: ID
        name: String
        surname: String
        email: String
        created: String
    }

    type Token {
        token: String
    }

    type Product {
        id: ID
        name: String
        stock: Int
        price: Float
        created: String
    }

    input UserInput {
        name: String!
        surname: String!
        email: String!
        password: String!
    }

    input AuthInput {
        email: String!
        password: String!
    }

    input ProductInput {
        name: String!
        stock: Int!
        price: Float!
    }

    input ClientInput {
        name: String!
        surname: String!
        email: String!
        phone: String
        seller: User!
    }

    type Query {
        # USERS
        getUser(token: String): User

        # PRODUCTS
        getProducts: [Product]
        getProductById(id: ID!): Product
    }

    type Mutation {
        # USERS
        newUser(input: UserInput): User
        authUser(input: AuthInput): Token
        
        # PRODUCTS
        newProduct(input: ProductInput): Product
        updateProduct( id: ID!, input: ProductInput): Product
        deleteProduct(id: ID!): String

        # CLIENTS
        newClient(input: ClientInput): Client
    }

`;

module.exports = typeDefs