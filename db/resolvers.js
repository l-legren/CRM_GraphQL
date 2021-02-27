// RESOLVERS
const User = require("../models/users");
const bcryptjs = require("bcryptjs");
require("dotenv").config({ path: "variables.env" });
const jwt = require("jsonwebtoken");

const createToken = (user, secretWord, expiresIn) => {
    console.log(user);
    const { id, name, surname } = user;
    return jwt.sign({ id, name, surname }, secretWord, { expiresIn });
};

const resolvers = {
    Query: {
        getUser: async (_, { token }) => {
            const userId = await jwt.verify(token, process.env.SECRET);
            return userId;
        },
    },
    Mutation: {
        newUser: async (_, { input }) => {
            const { email, password } = input;
            // Check if user is already registered
            const userExists = await User.findOne({ email });
            console.log(userExists);
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
                console.log("Error saving in DB", e);
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
                token: createToken(userExists, process.env.SECRET, "24h"),
            };
        },
    },
};

module.exports = resolvers;
