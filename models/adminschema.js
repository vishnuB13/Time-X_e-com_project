const mongoose = require('mongoose');

const AdminSchema = new mongoose.Schema({
 
     email:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    }
    
},{
    timestamps:true 
});

const admin = mongoose.model('Admin',AdminSchema);
 
module.exports = admin;