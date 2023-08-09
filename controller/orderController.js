const Order = require('../models/orderSchema');
const Address = require('../models/adressSchema');
const mongoose= require('mongoose');
const carthelper = require('../helpers/carthelper');
const wallet = require('../models/walletSchema');
const orderHelpers = require('../helpers/orderHelpers');


const returnOrder = async(req,res)=>{
  try {
    let userId = req.session.userId
    let orderId = req.body.orderId
    let itemId = req.body.ItemId
    let productId = req.body.productId
    let count = req.body.quantity
    let refundAmount = req.body.discountAmount
   refundAmount= parseInt(refundAmount)
    itemId = new mongoose.Types.ObjectId(itemId)
    orderId = new mongoose.Types.ObjectId(orderId)
    let order = await Order.findOne({ _id: orderId });
  

    // Find the index of the item in the products array
   let itemIndex = order.products.findIndex((item) => item._id.equals(itemId))
   
    if(itemIndex !== -1) {
     
      order.products[itemIndex].deliveryStatus = 'Return requested';
       await wallet.updateOne({ userId: userId }, { $inc: { walletAmount: refundAmount } });
      orderHelpers.increaseStock(productId, count);
    }

    await order.save();

    res.json({status:true})
  } catch (error) {
    console.log(error)
    res.status(500).render('user/error', { message: "An error occurred while processing your request." });     } 
   
}


const getOrderPage = async(req,res)=>{
   try {
    const userId = req.session.userId
    let userOrder = await Order.find({userId:userId}).sort({createdAt:-1})
    let cartTotal = carthelper.getCartTotal 
    let userdata = req.session.logged
    if(userdata){
      res.render('user/orderpage',{cartTotal,userOrder,header:true,userdata}) 
    }else{
      res.redirect('/login')
    }
   } catch (error) {
    console.log(error)
    res.status(500).render('user/error', { message: "An error occurred while processing your request." });     } 
   
}
const cancelOrder = async (req, res) => {
  try {
    console.log(req.body);
    let userId = req.session.userId;
    let itemId = req.body.itemId;
    itemId = new mongoose.Types.ObjectId(itemId);
    let orderId = req.body.orderId;
    orderId = new mongoose.Types.ObjectId(orderId);
    let productId = req.body.productId;
    let count = req.body.quantity;
    let deliveryStatus = req.body.deliveryStatus;
    count = parseInt(count);
    let refundAmount = req.body.refundAmount;
    let paymentMethod = req.body.paymentMethod;
    let productnew = [];
    let cancels = 0;
    orderId = new mongoose.Types.ObjectId(orderId);
    console.log(orderId);

    // Find the order document
    let order = await Order.findOne({ _id: orderId });

    // Find the index of the item in the products array
    const itemIndex = order.products.findIndex((item) => item._id.equals(itemId));

    // Update the deliveryStatus of the specific item
    if (itemIndex !== -1) {
      order.products[itemIndex].deliveryStatus = 'Cancelled';
    }
    for(let i=0;i<order.products.length;i++){
      if(order.products[i].deliveryStatus==="Cancelled"){
        cancels++
        console.log(cancels)
         productnew.push(cancels)
         console.log(productnew.length)
         
      }
      if(productnew.length==order.products.length){
        order.deliveryStatus="Order Cancelled"
      }
    }
    

    // Save the updated order document
    await order.save();

    if (paymentMethod === 'COD') {
      console.log('entered cancel cod');
      orderHelpers.increaseStock(productId, count);
    } else {
      console.log('entered cancel razor');
      await wallet.updateOne({ userId: userId }, { $inc: { walletAmount: refundAmount } });
      orderHelpers.increaseStock(productId, count);
    }

   

    res.json({ status: true });
  } catch (error) {
    console.log(error)
    res.status(500).render('user/error', { message: "An error occurred while processing your request." });     } 
};


module.exports={
returnOrder,
getOrderPage,
cancelOrder

} 




