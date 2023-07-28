const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
    deliveryDetails:{
        firstname:{type:String,required:true},
        lastname:{type:String,required:true},
        state: { type: String, required: true },
        streetaddress: { type: String, required: true },
        appartment: { type: String, required: true },
        town: { type: String, required: true },
        zip: { type: String, required: true },
        mobile: { type: String, required: true },
        email: { type: String, required: true },
       
    },
    userId:{type:mongoose.Schema.Types.ObjectId,ref:"User"},
    paymentMethod: { type: String, required: true },
    products:[
        {
            item: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
                quantity: {
                    type:Number,
                    
                },
               productnetprice:{
                   type:Number,
                   
                },
               productname:{
                type:String,
               },
               productId:{
                type:String
               },
                
                deliveryStatus:{
                    type:String
                },   
                 paymentStatus:{
                     type: String,
                },
                returnReason:{
                    type:String
                }
        }
    ],
  
    totalAmount: { type: Number, required: true },
    deliveryStatus: {type:String,required: true},
    createdAt: { type: Date, default: Date.now },
})  

const Orders = mongoose.model("Order",OrderSchema)
module.exports = Orders;