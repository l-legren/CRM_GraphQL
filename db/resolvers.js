// RESOLVERS
const User = require("../models/users");
const Product = require("../models/products");
const Client = require("../models/clients");
const bcryptjs = require("bcryptjs");
require("dotenv").config({ path: "variables.env" });
const jwt = require("jsonwebtoken");

const createToken = (user, secretWord, expiresIn) => {
    // console.log(user);
    const { id, name, surname } = user;
    return jwt.sign({ id, name, surname }, secretWord, { expiresIn });
};

const resolvers = {
    Query: {
        getUser: async (_, { token }) => {
            const userId = await jwt.verify(token, process.env.SECRET);
            return userId;
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
            console.log(ctx)
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
                throw new Error("No credentials for this client")
            }
            return client
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
        updateClient: async (_, {id, input}, ctx) => {
            // Check if client exists
            let client = await Client.findById(id)
            console.log("Client", client)
            if (!client) {
                throw new Error("Client doesnt exists")
            }
            if(client.seller.toString() !== ctx.user.id) {
                throw new Error("No credentials for this user")
            }
            // Update Client
            try {
                client = Client.findOneAndUpdate({_id: id }, input, {new: true})
                return client
            } catch (error) {
                console.log("Error updating client", error)
            }
        }
    },
};

module.exports = resolvers;
