const mongoose = require('mongoose')
const cartSchema = new mongoose.Schema({ 
    product:[
             {
                productname:{
                    type:String,
                    required:true
                },
                brand:{
                    type:String,
                    required:true
                },
                quantity:{
                    type:Number,
                    required:true
                },
                productnetprice:{
                    type:Number,
                    required:true
                },productId:{
                    type:String,
                    required:true
                }
            }
    ], userId:{ 
        type:String, 
        required:true
    },discount:{
        type:Number,
        default:0
    }
}, 
{
    timestamps:true
})

const cart = mongoose.model('Cart',cartSchema)

module.exports = cart