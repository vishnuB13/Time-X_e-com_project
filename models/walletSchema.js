const mongoose = require('mongoose')

let walletSchema = new mongoose.Schema({
    walletAmount:{type:Number},    
    userId:{type:String,required:true,ref:"User"}
})

let wallet = mongoose.model('Wallet',walletSchema) 
module.exports = wallet;