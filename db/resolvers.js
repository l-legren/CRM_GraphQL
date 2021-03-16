// RESOLVERS
const User = require("../models/users");
const Product = require("../models/products");
const Client = require("../models/clients");
const Order = require("../models/orders");
const bcryptjs = require("bcryptjs");
require("dotenv").config({ path: "variables.env" });
const jwt = require("jsonwebtoken");
const { findById } = require("../models/users");

const createToken = (user, secretWord, expiresIn) => {
    // console.log(user);
    const { id, name, surname } = user;
    return jwt.sign({ id, name, surname }, secretWord, { expiresIn });
};

const resolvers = {
    Query: {
        getUser: async (_, {}, ctx) => {
            return ctx.user;
        },
        getProducts: async () => {
            try {
                const products = await Product.find({});
                return products;
            } catch (e) {
                console.log("Error getting Products from DB", e);
            }
        },
        getProductById: async (_, { id }) => {
            const productById = await Product.findById(id);
            if (!productById) {
                throw new Error("Product doesnt exist");
            }
            try {
                return productById;
            } catch (e) {
                console.log("Error getting Product by ID", e);
            }
        },
        getClients: async (_, {}) => {
            try {
                const clients = await Client.find({});
                return clients;
            } catch (error) {
                console.log("Error getting Clients", error);
            }
        },
        getClientsSeller: async (_, {}, ctx) => {
            console.log(ctx);
            try {
                const clients = await Client.find({ seller: ctx.user.id });
                return clients;
            } catch (error) {
                console.log("Error getting Clients Seller", error);
            }
        },
        getClientById: async (_, { id }, ctx) => {
            const client = await Client.findById(id);

            if (!client) {
                throw new Error("client not found");
            }
            if (client.seller.toString() !== ctx.user.id) {
                throw new Error("No credentials for this client");
            }
            return client;
        },
        getOrders: async () => {
            try {
                const orders = await Order.find({});
                return orders;
            } catch (error) {
                console.log("Error fetching orders", error);
            }
        },
        getOrderBySeller: async (_, {}, ctx) => {
            // Check if order exists
            const order = await Order.find({ seller: ctx.user.id }).populate(
                "client"
            );
            if (!order) {
                throw new Error("Order not found");
            }
            try {
                console.log(order);
                return order;
            } catch (error) {
                console.log("Error getting order", error);
            }
        },
        getOrderById: async (_, { id }, ctx) => {
            // Check if order exists
            const order = await Order.findById(id);
            if (!order) {
                throw new Error("Order not found");
            }
            console.log(order.seller, ctx.user.id);
            if (order.seller.toString() !== ctx.user.id) {
                throw new Error("No credentials for this order");
            }
            return order;
        },
        getOrdersStatus: async (_, { status }, ctx) => {
            const orders = await Order.find({ seller: ctx.user.id, status });
            return orders;
        },
        bestClients: async () => {
            const clients = await Order.aggregate([
                { $match: { status: "COMPLETED" } },
                {
                    $group: {
                        _id: "$client",
                        total: {
                            $sum: "$total",
                        },
                    },
                },
                {
                    $lookup: {
                        from: "clients",
                        localField: "_id",
                        foreignField: "_id",
                        as: "client",
                    },
                },
                {
                    $sort: {
                        total: -1,
                    },
                },
            ]);
            return clients;
        },
        bestSellers: async () => {
            const sellers = await Order.aggregate([
                {
                    $match: {
                        status: "COMPLETED",
                    },
                },
                {
                    $group: {
                        _id: "$seller",
                        total: {
                            $sum: "$total",
                        },
                    },
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "_id",
                        foreignField: "_id",
                        as: "seller",
                    },
                },
                {
                    $sort: {
                        total: -1,
                    },
                },
            ]);
            return sellers;
        },
        searchProduct: async (_, { text }) => {
            const products = await Product.find({ $text: { $search: text } });
            return products;
        },
    },
    Mutation: {
        newUser: async (_, { input }) => {
            const { email, password } = input;
            // Check if user is already registered
            const userExists = await User.findOne({ email });
            if (userExists) {
                throw new Error("User already registered");
            }
            // Hash the password
            const salt = await bcryptjs.genSalt(10);
            input.password = await bcryptjs.hash(password, salt);

            // Insert into DB
            try {
                // Save in DB
                const user = new User(input);
                user.save();
                return user;
            } catch (e) {
                console.log("Error saving User in DB", e);
            }
        },
        authUser: async (_, { input }) => {
            const { email, password } = input;
            // User exists?
            const userExists = await User.findOne({ email });
            if (!userExists) {
                throw new Error("User doesnt exists");
            }
            // Check if password is correct
            const passCorrect = await bcryptjs.compare(
                password,
                userExists.password
            );
            if (!passCorrect) {
                throw new Error("Password is incorrect");
            }
            // Create the Token
            return {
                token: createToken(userExists, process.env.SECRET, "48h"),
            };
        },
        newProduct: async (_, { input }) => {
            const { name, stock, price } = input;
            // Check if product exists
            const productExists = await Product.findOne({ name });

            if (productExists) {
                throw new Error("Product already exists");
            }

            try {
                // Saving in DB
                const newProduct = new Product(input);
                const result = await newProduct.save();
                console.log("This is result after saving in DB", result);
                return result;
            } catch (e) {
                console.log("Error saving product in DB");
            }
        },
        updateProduct: async (_, { id, input }) => {
            // Check if product exists and since is gonna updated declare with let!
            let product = await Product.findById(id);
            if (!product) {
                throw new Error("Product doesnt exists");
            }
            // Save and update in DB
            product = await Product.findOneAndUpdate({ _id: id }, input, {
                new: true,
            });
            return product;
        },
        deleteProduct: async (_, { id }) => {
            let product = await Product.findById(id);
            if (!product) {
                throw new Error("Product to delete not found in inventory");
            }
            await Product.findOneAndDelete({ _id: id });

            return "Product deleted from inventory";
        },
        newClient: async (_, { input }, ctx) => {
            console.log(input);
            const { email, seller } = input;
            // check if client is already registered
            const client = await Client.findOne({ email });
            if (client) {
                throw new Error("Client already registered");
            }
            // Assign a seller
            const newClient = new Client(input);
            console.log("This is the context", ctx);
            newClient.seller = ctx.user.id;
            // Save into DB
            try {
                const result = await newClient.save();
                return result;
            } catch (error) {
                console.log("Error saving new Client into DB", error);
            }
        },
        updateClient: async (_, { id, input }, ctx) => {
            // Check if client exists
            let client = await Client.findById(id);
            console.log("Client", client);
            if (!client) {
                throw new Error("Client doesnt exists");
            }
            if (client.seller.toString() !== ctx.user.id) {
                throw new Error("No credentials for this user");
            }
            // Update Client
            try {
                client = Client.findOneAndUpdate({ _id: id }, input, {
                    new: true,
                });
                return client;
            } catch (error) {
                console.log("Error updating client", error);
            }
        },
        deleteClient: async (_, { id }, ctx) => {
            // Check if client exists
            const client = await Client.findById(id);
            if (!client) {
                throw new Error("Client not found");
            }
            // Check credentials of user
            if (client.seller.toString() !== ctx.user.id) {
                throw new Error("No credentials for this user");
            }
            // Delete client
            try {
                await Client.findOneAndDelete({ _id: id });
                return "Client deleted";
            } catch (error) {
                console.log("Error deleting Client", error);
            }
        },
        newOrder: async (_, { input }, ctx) => {
            // Check client exists
            const client = await Client.findById(input.client);
            if (!client) {
                throw new Error("Client not found");
            }
            // Check credentials of user
            if (client.seller.toString() !== ctx.user.id) {
                throw new Error("No credentials for this user");
            }
            // Check that stock is enough
            for await (const article of input.order) {
                const product = await Product.findById(article.id);
                if (article.quantity > product.stock) {
                    throw new Error("Quantity exceeds available stock");
                } else {
                    product.stock = product.stock - article.quantity;
                    await product.save();
                }
            }
            // Create new Order
            const newOrder = new Order(input);
            newOrder.seller = ctx.user.id;
            const result = await newOrder.save();
            return result;
            // Save it into db
        },
        updateOrder: async (_, { id, input }, ctx) => {
            // Check if client and order exists
            let order = await Order.findById(id);
            if (!order) {
                throw new Error("Order doesnt exists");
            }
            let client = await Client.findById(input.client);
            if (!client) {
                throw new Error("Client doesnt exists");
            }
            // Check credentials
            if (client.seller.toString() !== ctx.user.id) {
                throw new Error("No credentials for this user");
            }
            // Check stock
            if (input.order) {
                for await (const article of input.order) {
                    const product = await Product.findById(article.id);
                    if (article.quantity > product.stock) {
                        throw new Error("Quantity exceeds available stock");
                    } else {
                        product.stock = product.stock - article.quantity;
                        await product.save();
                    }
                }
            }
            // Update Client
            try {
                order = Order.findOneAndUpdate({ _id: id }, input, {
                    new: true,
                });
                return order;
            } catch (error) {
                console.log("Error updating client", error);
            }
        },
        deleteOrder: async (_, { id }, ctx) => {
            // Check order
            const order = await Order.findById(id);
            // Check credentials
            if (order.seller != ctx.user.id) {
                throw new Error("No credentials for this order");
            }
            // Deleting from DB
            try {
                await Order.findByIdAndDelete(id);
                return "Order deleted";
            } catch (error) {
                console.log("Error removing order");
            }
        },
    },
};

module.exports = resolvers;
