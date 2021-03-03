const mongoose = require("mongoose");

const productsSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    stock: {
        type: Number,
        requred: true,
        trim: true
    },
    price: {
        type: Number,
        required: true,
        trim: true
    },
    created: {
        type: Date,
        default: Date.now()
    }
});

productsSchema.index( { name: 'text' } )

module.exports = mongoose.model("Product", productsSchema);
