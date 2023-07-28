const mongoose=require('mongoose')

const wishlistSchema = new mongoose.Schema({
    userId:{type:String,required:true},
    product:[
        {
            productname:{type:String,required:true},
            brand:{type:String,required:true},
            image:{type:String,required:true},
            productId:{type:String,required:true}
        }
    ] 
})
const wishlist = mongoose.model("wishlist",wishlistSchema)
 
module.exports = wishlist