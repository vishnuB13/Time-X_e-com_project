const Cart = require('../models/cartSchema')
const Product = require('../models/productSchema')
const cartHelper = require('../helpers/carthelper');
const user = require('../models/loginschema');
const mongoose=require('mongoose')
const ObjectId = mongoose.Types.ObjectId;

let quantity = 1;
     

const getCart = async(req,res) =>{ 
    try {
        let userId = req.session.userId;
cartHelper.getCartProducts(userId).then(async(cartItems)=>{
    console.log(cartItems);
    let cartTotal = await  cartHelper.getCartTotal(userId)
   if(cartItems.length > 0){ cartTotal = cartTotal[0].total}
    res.render('user/cart',{cartItems,cartTotal,header:true,userdata:true})     
}) 
    } catch (error) {
        console.log(error)
        res.status(500).render('user/error', { message: "An error occurred while processing your request." });     }   
    }  
  
const changeQuantity = async(req,res)=>{

try{
    let {productId,cartId,count,quantity} = req.body;
    count = parseInt(count)
    quantity = parseInt(quantity)
    if(count == -1 && quantity == 1){
        res.json({status:false})
    }else{
        if(count != -1){
            let products = await Product.findById(productId)
            if(quantity >= products.quantity){
                res.json({status:false})
            }else{
                await Cart.updateOne({_id:cartId,"product.productId":productId},{$inc:{"product.$.quantity":count}})
                 res.json({status:true})
            }
        }else{
            await Cart.updateOne({_id:cartId,"product.productId":productId},{$inc:{"product.$.quantity":count}})
             res.json({status:true})
        }
    }
}catch(e){
    console.log(error)
    res.status(500).render('user/error', { message: "An error occurred while processing your request." });     } 
}

const removeCartItem =async (req,res)=>{
   try {
   const {productId,cartId} = req.body;
   let unique_id = new ObjectId(productId)
   await Cart.updateOne(
      {
       _id:cartId
      },
      {
       $pull:{product:{_id:unique_id}}
      }
   )
        res.json({status:true})

   
   } catch (error) {
    console.log(error)
    res.status(500).render('user/error', { message: "An error occurred while processing your request." });     } 
}




const getProductId = async(req,res)=>{
    try {
      
        if(!req.session.logged){
            res.json({status:false})
        }
        else{ 
         let  productId=req.body.productId
            let cartObjectData = await Product.findById(productId)
            let prodquantity =cartObjectData.quantity
            let userId =req.session.userId
            let cartPresentData = await cartHelper.allCartItems(userId)
            if(cartPresentData===null){
              
                    let newCartItem= new Cart({
                        product:[{ productname:cartObjectData.productName, 
                            brand:cartObjectData.brand,
                            quantity:quantity,
                            productnetprice:cartObjectData.offPrice,
                            productId:productId,       
                    }],userId:req.session.userId    
                        })
                      await Cart.create(newCartItem)
            }  else{
              let productAlreadyExist = cartPresentData.product.findIndex((product)=>product.productId.toString()===productId.toString())
                if(productAlreadyExist!==-1){
                    await Cart.updateOne({userId:userId,"product.productId":productId},{$inc:{"product.$.quantity":1}})
            }else{
                        await Cart.updateOne({userId:userId},{$push: {product:{ productname:cartObjectData.productName, 
                            brand:cartObjectData.brand,
                            quantity:quantity,
                            productnetprice:cartObjectData.offPrice,
                            productId:productId}}})
                            
                    } 
            } 
            res.json({status:true})
        }    
 } catch (error) {
    console.log(error)
    res.status(500).render('user/error', { message: "An error occurred while processing your request." });     } }


module.exports = {
    getCart,
    getProductId,
    changeQuantity,
    removeCartItem   
}