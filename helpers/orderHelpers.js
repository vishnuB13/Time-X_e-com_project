const { default: mongoose } = require('mongoose')
const Order = require('../models/orderSchema')
const Product = require('../models/productSchema')
const Razorpay = require('razorpay')
var instance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});



module.exports = {
  placeOrder: async (addressfind, paymentOption, paymentStatus, deliveryStatus, userId, cartProductData, cartTotal,orderId,discountAmount,discount,totals) => {
  let totalAmount = cartTotal[0].total-cartTotal[0].discount
   console.log(totalAmount)
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
      orderId: orderId,
      paymentMethod: paymentOption,
      products: products, // Assign the products array to the newOrder object
      totalAmount: discountAmount,
      discount:discount,
      total:totals,
      deliveryStatus: deliveryStatus,
    });
  
    try {
      let orderDoc = await Order.create(newOrder);
      return orderDoc;
    } catch (e) {
      // Handle any errors that occur during order creation
    }
  },
 generateUniqueID:async()=> {
    let uniqueID;
    let isUnique = false;

    while (!isUnique) {
        // Generate a random 6-digit number
        uniqueID = Math.floor(100000 + Math.random() * 900000);

        // Check if the generated number already exists in the database
        const existingOrder = await Order.findOne({ orderID: uniqueID });
        if (!existingOrder) {
            isUnique = true;
        }
    }

    return uniqueID;
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
        res.status(500).render('user/error', { message: "An error occurred while processing your request." });   

      }
    },
    increaseStock: async(productId,count)=>{ 
    try {
      count = parseInt(count)
      let productid = new mongoose.Types.ObjectId(productId)
      await Product.updateOne({_id:productid},{$inc:{quantity:count}})
    } catch (error) {
      res.status(500).render('user/error', { message: "An error occurred while processing your request." });   

    }
    },
    generateRazorPay:(orderId,total)=>{
      total = parseInt(total)
      return new Promise((resolve, reject) => {
      

        var options = {
            amount: total * 100,
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
     res.status(500).render('user/error', { message: "An error occurred while processing your request." });   

    }
  },  
  deleteOrder:async (orderId)=>{
    orderId = new mongoose.Types.ObjectId(orderId)
    try{
      await Order.deleteOne({_id:orderId})
    }catch(e){
      console.log(e);
      res.status(500).render('user/error', { message: "An error occurred while processing your request." });   

    }
  },
  orderTotal:async()=>{
    const result = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalAmountSum: { $sum: "$discount" }
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
      res.status(500).render('user/error', { message: "An error occurred while processing your request." });   
    }
  }
,

    weeklySales:async ()=>{
        try{
            let weeklyReport =   await Order.aggregate([
                {
                 $unwind:'$products'
                },
                {
                 $match: {
                     'products.deliveryStatus': {
                         $nin: ['Cancelled','Returned']
                     }
                 }
                },
                {
                  $group:{
                    _id:'$createdAt',
                    total:{
                       $sum:'$totalAmount'
                            }  
                    }
                },
                {
                    $sort:{
                        '_id':-1
                    }
                },
                {
                    $limit:7
                },
                {
                    $sort:{
                        '_id':1
                    }
                }
             ])
              weeklyReport = weeklyReport.map((document) => ({
                date: document._id.toLocaleDateString('en-US'),
                total: document.total
              }));

          return weeklyReport;

        }catch(e){
            console.log(e);
            res.status(500).render('user/error', { message: "An error occurred while processing your request." });   

        }
     },
     weekTotal: async ()=>{
        let weekTotal = await Order.aggregate([
            {
                $unwind:'$products'
            },
            {
                $match:{
                    'products.deliveryStatus':{
                         $nin: ['Cancelled','Returned']
                        }
                }
            },
            {
                $group:{
                  _id:'$createdAt',
                  total:{
                     $sum:'$totalAmount'
                          }  
                  }
              },
              {
                  $sort:{
                      '_id':-1
                  }
              },
              {
                  $limit:7
              },
              {
                  $sort:{
                      '_id':1
                  }
              },
              {
                $group: {
                    _id: null,
                    totalAmount: {
                        $sum: '$total'
                    }
                }
              }

        ])
        return weekTotal;
     },
     monthlySales:async()=>{
        try{
            let monthlySales = await Order.aggregate([
               {
                $unwind:'$products'
               },
               {
                $match:{
                    'products.deliveryStatus':{
                         $nin: ['Cancelled','Returned']
                        }
                }
               },
               {
                $group:{
                    _id:{
                        $dateToString: {
                          format: '%m-%Y', // format to extract year and month
                          date: '$createdAt'
                        }
                      },
                      total:{
                        $sum:'$totalAmount'
                             }  
                     
                }
               },
               {
                $sort:{
                    '_id':-1
                }
               },
               {
                $limit:7
               },
               {
                $sort:{
                    '_id':1
                }
               },
               

            ])
console.log(monthlySales);
            return monthlySales
            
        }catch(e){
            console.log(e);
            res.status(500).render('user/error', { message: "An error occurred while processing your request." });   

        }
     },
     monthlyTotal:async ()=>{
        try{
            let monthlyTotal = await Order.aggregate([
                {
                    $unwind:'$products'
                },
                {
                    $match:{
                       'products.deliveryStatus':{
                        $nin:['Cancelled','Returned']
                       }
                    }
                },
                {
                 $group:{
                      _id:{
                          $dateToString: {
                          format: '%m-%Y', // format to extract year and month
                          date: '$createdAt'
                      }
                         },
                    total:{
                     $sum:'$totalAmount'
                          }  
                         
                  }
                 },
                {
                    $sort:{
                        '_id':-1
                    }
               },
               {
                    $limit:7
               },
               {
                  $sort:{
                        '_id':1
                    }
               },
               {
                $group: {
                    _id: null,
                    totalAmount: {
                        $sum: '$total'
                    }
                }
              }
    
            ])

            return monthlyTotal;

        }catch(e){
            console.log(e);
            res.status(500).render('user/error', { message: "An error occurred while processing your request." });   

        }
     },
     yearlySales:async()=>{
        try{
            let yearlySales = await Order.aggregate([
                {
                 $unwind:'$products'
                },
                {
                 $match:{
                     'products.deliveryStatus':{
                          $nin: ['Cancelled','Returned']
                         }
                 }
                },
                {
                 $group:{
                     _id:{
                         $dateToString: {
                           format: '%Y', // format to extract year and month
                           date: '$createdAt'
                         }
                       },
                       total:{
                         $sum:'$totalAmount'
                              }  
                      
                 }
                },
                {
                 $sort:{
                     '_id':-1
                 }
                },
                {
                 $limit:7
                },
                {
                 $sort:{
                     '_id':1
                 }
                },
                
 
             ])
 
             return yearlySales
             


        }catch(e){
            console.log(e);
            res.status(500).render('user/error', { message: "An error occurred while processing your request." });   

        }
     },
     yearTotal: async()=>{
        try{
            let yearTotal = await Order.aggregate([
                {
                    $unwind:'$products'
                },
                {
                    $match:{
                       'products.deliveryStatus':{
                        $nin:['Cancelled','Returned']
                       }
                    }
                },
                {
                 $group:{
                      _id:{
                          $dateToString: {
                          format: '%Y', // format to extract year and month
                          date: '$createdAt'
                      }
                         },
                    total:{
                     $sum:'$totalAmount'
                          }  
                         
                  }
                 },
                {
                    $sort:{
                        '_id':-1
                    }
               },
               {
                    $limit:7
               },
               {
                  $sort:{
                        '_id':1
                    }
               },
               {
                $group: {
                    _id: null,
                    totalAmount: {
                        $sum: '$total'
                    }
                }
              }
    
            ])

            return yearTotal;

        }catch(e){
            console.log(e);
            res.status(500).render('user/error', { message: "An error occurred while processing your request." });   

        }

     },
     totalSales:async ()=>{
        try{
            let salesTotal = await Order.aggregate([
                {
                    $unwind:'$products'
                },
                {
                    $match:{
                    'products.deliveryStatus':{
                        $nin:['Cancelled','Returned']
                    }
                    }
                },
                {
                    $group:{
                        _id:null,
                        salesTotal:{
                            $sum:'$totalAmount'
                        }
                    }

                }
            ])

           

            return salesTotal

        }catch(e){
            console.log(e);
            res.status(500).render('user/error', { message: "An error occurred while processing your request." });   

        }
     },
     allOrderBasedOnMonths: async ()=>{
        try{
                    
            const startOfYear = new Date(new Date().getFullYear(), 0, 1); // start of the year
            const endOfYear = new Date(new Date().getFullYear(), 11, 31); // end of the year
        
            let orderBasedOnMonths = await Order.aggregate([
            // match orders within the current year
            { $match: { createdAt: { $gte: startOfYear, $lte: endOfYear } } },
        
            // group orders by month
            {
                $group: {
                _id: { $month: "$createdAt" },
                orders: { $push: "$$ROOT" }
                }
            },
        
            // project the month and orders fields
            {
                $project: {
                _id: 0,
                month: "$_id",
                orders: 1
                }
            },
            {
                $project: {
                month: 1,
                orderCount: { $size: "$orders" }
                }
            }
            , {
                $sort: { month: 1 }
            }
            ]);
           
        
        return orderBasedOnMonths;

        }catch(e){
            console.log(e);
            res.status(500).render('user/error', { message: "An error occurred while processing your request." });   

        }
     },
     cancelledOrders : async ()=>{
        try{
            let cancelledOrders = await Order.aggregate([
                {
                   $unwind:'$products'
                },
                // match orders within the current year
                {
                    $match:{
                        'products.deliveryStatus':{
                            $in:['Cancelled']
                        }
                        }
                
                },
                   
                // group orders by month
                {
                    $group: {
                    _id: { $month: "$createdAt" },
                    orders: { $push: "$$ROOT" }
                    }
                },
            
                // project the month and orders fields
                {
                    $project: {
                    _id: 0,
                    month: "$_id",
                    orders: 1
                    }
                },
                {
                    $project: {
                    month: 1,
                    orderCount: { $size: "$orders" }
                    }
                }
                , {
                    $sort: { month: 1 }
                }
                ]);
            
            return cancelledOrders;

        }catch(e){
          res.status(500).render('user/error', { message: "An error occurred while processing your request." });   

        }
     },
     returnedOrders: async ()=>{
        try{
            let returnedOrders = await Order.aggregate([
                {
                    $unwind:'$products'
                },
                {
                    $match:{
                        'products.deliveryStatus':{
                            $in:['Returned']
                        }
                    }
                },
                {
                    $group: {
                    _id: { $month: "$createdAt" },
                    orders: { $push: "$$ROOT" }
                    }
                },
                {
                    $project: {
                    _id: 0,
                    month: "$_id",
                    orders: 1
                    }
                },
                {
                    $project: {
                    month: 1,
                    orderCount: { $size: "$orders" }
                    }
                }
                , {
                    $sort: { month: 1 }
                }

            ])

            return returnedOrders;

        }catch(e){
          res.status(500).render('user/error', { message: "An error occurred while processing your request." });   

        }

     },
     monthSales: async ()=>{
        try{
            let monthlySales = await Order.aggregate([
                {
                    $unwind:'$products'
                },
                {
                    $match:{
                        'products.deliveryStatus':{
                            $nin:['Cancelled','Returned']
                        }
                    }
                },
                {
                    $group: {
                    _id: { $month: "$createdAt" },
                    total:{
                        $sum:'$totalAmount'
                             }  
                    }
                },
                {
                    $project: {
                    _id: 0,
                    month: "$_id",
                    total: 1
                    }
                },
                {
                    $sort: { month: 1 }
                }

            ])
            return monthlySales;

        }catch(e){
            console.log(e);
            res.status(500).render('user/error', { message: "An error occurred while processing your request." });   

        }
     } 
}