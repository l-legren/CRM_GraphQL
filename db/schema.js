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

    type Client {
        id: ID
        name: String
        surname: String
        company: String
        email: String
        phone: String
        seller: ID
    }

    type Order {
        id: ID!
        order: [OrderGroup]
        total: Float
        client: ID
        seller: ID
        date: String
        status: OrderStatus
    }

    type OrderGroup {
        id: ID
        quantity: Int
    }

    type TopClient {
        total: Float
        client: [Client]
    }

    type TopSeller {
        total: Float
        seller: [User]
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
        company: String!
        email: String!
        phone: String
    }

    input OrderProductInput {
        id: ID
        quantity: Int
        name: String
        price: Float
    }

    input OrderInput {
        order: [OrderProductInput]
        total: Float
        client: ID
        status: OrderStatus
    }

    enum OrderStatus {
        PENDING
        COMPLETED
        CANCELLED
    }

    type Query {
        # USERS
        getUser: User

        # PRODUCTS
        getProducts: [Product]
        getProductById(id: ID!): Product

        # CLIENTS
        getClients: [Client]
        getClientsSeller: [Client]
        getClientById(id: ID!): Client

        # ORDERS
        getOrders: [Order]
        getOrderBySeller(id: ID!): [Order]
        getOrderById(id: ID!): Order 
        getOrdersStatus(status: String!): [Order]

        # ADVANCED SEARCH
        bestClients: [TopClient]
        bestSellers: [TopSeller]
        searchProduct(text: String!): [Product]
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
        updateClient(id: ID!, input: ClientInput): Client
        deleteClient(id: ID!): String

        # ORDERS
        newOrder(input: OrderInput): Order
        updateOrder(id: ID!, input: OrderInput): Order
        deleteOrder(id: ID!): String
    }

`;

module.exports = typeDefs