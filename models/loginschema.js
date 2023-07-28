const mongoose = require('mongoose')

const loginSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
     email:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    mobile:{
        type:Number,
        required:true
    },
    isBlocked:{
        type:Boolean,
        default:false

    }
},{
    timestamps:true
}
)

     

const user = mongoose.model('User',loginSchema)


module.exports = user;