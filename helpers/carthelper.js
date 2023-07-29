const mongoose = require('mongoose')
const Cart = require('../models/cartSchema')




module.exports = {
allCartItems: async (userId)=>{
    let cartItems=  await Cart.findOne({userId:userId})
    return cartItems

},
getCartProducts: async (userId)=>{
        
    userId = userId.toString();
    try{
        
      let  cartItems = await Cart.aggregate([
            {
                $match:{userId},
            },
            {
                $unwind:"$product",
            },
            {
                $project:{
                    item:{$toObjectId:"$product.productId"},
                    quantity:"$product.quantity",
                    currentPrice:"$product.productnetprice",
                    unique_id:"$product._id"
                }
            },
            {
                $lookup:{
                    from:"products",
                    localField:"item",
                    foreignField:"_id",
                    as:"productInfo"
                }
            },{
              $project:{
                unique_id:1,
                item:1,
                quantity:1,
                currentPrice:1,
                productInfo:{$arrayElemAt:["$productInfo",0]}

              }  
            }

        ]);
      
        return cartItems;
    }catch(e){
        console.log(e,"error on getting cart products");
    }
    
      
},
getCartTotal:async (userId)=>{
    let response = {};
    try{
        let grandTotal = await Cart.aggregate([
            {
                $match:{userId},
            },
            {
                $unwind:"$product",
            }, 
            {
                $project:{
                    item:{$toObjectId:"$product.productId"},
                    quantity:"$product.quantity",
                    currentPrice:"$product.productnetprice",
                    discount:1
                },
            },
            {
                $lookup:{
                    from:"products",
                    localField:"item",
                    foreignField:"_id",
                    as:"productInfo",
                },
            },
            {
              $project:{
                item:1,
                quantity:1,
                currentPrice:1,
                discount:1,
                productInfo:{$arrayElemAt:["$productInfo",0]},

              },  
            },
            {
              $group:{ 
                _id:null,
                
                total:{ $sum:{
                    $multiply:["$quantity","$currentPrice"],
                } },
                discount:{$first:"$discount"}
            
              }  
            }
      ]);
      return grandTotal
    }catch(e){
        console.log(e,"error in getting total of cart");
    }
}
}
