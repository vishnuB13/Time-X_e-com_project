const mongoose = require('mongoose')

const ProductSchema = new mongoose.Schema({
    productName:{
        type:String,
        required:true
    },
    brand:{
        type:String,
        required:true
    },
    category:{
        type:String,
        required:true
        
    },
    strapColour:{
        type:String,
        required:true
    },
    
    price:{
        type:String,
        required:true
    },
    offPrice:{
        type:String,
        required:true
    },
    images:[
        {type:String}
    ],
    quantity:{
        type:Number,
        required:true
    },
    description:{
        type:String
    },
    deleted:{
        type:Boolean,
        default:false
    }
})
const product = mongoose.model('Products',ProductSchema)

module.exports = product;