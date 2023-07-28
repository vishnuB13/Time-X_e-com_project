const { default: mongoose } = require('mongoose')
const Order = require('../models/orderSchema')
const Product = require('../models/productSchema')
const Razorpay = require('razorpay')
var instance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});



module.exports = {
  placeOrder: async (addressfind, paymentOption, paymentStatus, deliveryStatus, userId, cartProductData, cartTotal) => {
    console.log(cartTotal);
    console.log(cartProductData);
    console.log(deliveryStatus)
  
    // Create an array to hold the product objects
    let products = [];
  
    // Iterate over cartProductData to create product objects
    cartProductData.forEach((product) => {
      // Create a new product object for each iteration
      let productObject = {
        quantity: product.quantity,
        productname: product.productname,
        productId: product.productId,
        productnetprice: product.productnetprice,
        deliveryStatus: deliveryStatus,
        paymentStatus: paymentStatus,
      }; 
  
      // Push the product object to the products array
      products.push(productObject);
    });
  
    let newOrder = new Order({
      deliveryDetails: addressfind,
      userId: userId,
      paymentMethod: paymentOption,
      products: products, // Assign the products array to the newOrder object
      totalAmount: cartTotal[0].total-cartTotal[0].discount,
      deliveryStatus: deliveryStatus,
    });
  
    try {
      let orderDoc = await Order.create(newOrder);
      return orderDoc;
    } catch (e) {
      // Handle any errors that occur during order creation
    }
  },
  

    decreaseStock: async (productId,count)=>{
      
      try {
        count = parseInt(count)
        let productid = new mongoose.Types.ObjectId(productId)
        let product = await Product.findById(productId)
        let quantity = product.quantity
        
        if(quantity>=count){
          (await Product.updateOne({_id:productid},{$inc:{quantity:-count}}))
        }
       


      } catch (error) {
        console.log(error)
      }
    },
    increaseStock: async(productId,count)=>{ 
    try {
      count = parseInt(count)
      let productid = new mongoose.Types.ObjectId(productId)
      await Product.updateOne({_id:productid},{$inc:{quantity:count}})
    } catch (error) {
      
    }
    },
    generateRazorPay:(orderId,total)=>{
      total = parseInt(total)
      return new Promise((resolve, reject) => {
      

        var options = {
            amount: total * 100,  // amount in the smallest currency unit
            currency: "INR",
            receipt: "" + orderId
        };


    instance.orders.create(options, function (err, order) {
        if (err) {
            console.log(err)
        } else {
            console.log('razor payyyyyyyyyyyy');
            console.log(order);
            resolve(order)
          }
        });
    })
  },

  

  verifyPayment:(details)=>{
    return new Promise((resolve,reject)=>{
      const crypto = require('crypto');
      let hmac = crypto.createHmac('sha256', 'HyxeUWakIm6NF9DIOwUx3IZZ')

      hmac.update(details['payment[razorpay_order_id]'] + '|' + details['payment[razorpay_payment_id]']);
      hmac = hmac.digest('hex')
      if (hmac == details['payment[razorpay_signature]']) {
          console.log('become equal tooooooooo');
          resolve()
      } else {
          console.log('entered to case not equalllllllllllllll');
          reject()
      }

    })
  },
  
  changeRazorStatus:async(orderId)=>{
    orderId = new mongoose.Types.ObjectId(orderId)
    try{
     await Order.updateOne({_id:orderId},
       {
          $set:{
           'products.$[].deliveryStatus':"Order Confirmed"
          }
       }
       )
    }catch(e){
     console.log(e);
    }
  },  
  deleteOrder:async (orderId)=>{
    orderId = new mongoose.Types.ObjectId(orderId)
    try{
      await Order.deleteOne({_id:orderId})
    }catch(e){
      console.log(e);
    }
  },
  orderTotal:async()=>{
    const result = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalAmountSum: { $sum: "$totalAmount" }
        }
      }
    ]);
   
    return result

  },
   getRevenueData : async () => {
    try {
      const revenueData = await Order.aggregate([
        {
          $group: {
            _id: { $substrCP: ['$createdAt', 0, 7] }, // Group by year and month (YYYY-MM)
            totalRevenue: { $sum: '$totalAmount' }, // Calculate the total revenue in each group
          },
        },
        {
          $project: {
            month: '$_id', // Rename _id to month
            totalRevenue: 1,
          },
        },
        {
          $sort: { month: 1 }, // Sort the results by month in ascending order
        },
      ]);
  
      return revenueData;
    } catch (err) {
      throw err;
    }
  },

   getOrderData : async () => {
    try {
      const ordersData = await Order.aggregate([
        {
          $group: {
            _id: { $substrCP: ['$createdAt', 0, 7] }, // Group by year and month (YYYY-MM)
            ordersCount: { $sum: 1 }, // Count the number of orders in each group
          },
        },
        {
          $project: {
            month: '$_id', // Rename _id to month
            ordersCount: 1,
          },
        },
        {
          $sort: { month: 1 }, // Sort the results by month in ascending order
        },
      ]);
  
      return ordersData;
    } catch (err) {
      throw err;
    }
  }
  
  
}