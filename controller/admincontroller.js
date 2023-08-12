const Admin = require('../models/adminschema') 
const User = require('../models/loginschema')
const Product = require('../models/productSchema')
const Category = require('../models/categoryschema')
const Order = require('../models/orderSchema')
const Wallet = require('../models/walletSchema')
const Banner = require('../models/bannerSchema')
const cartHelper=require('../helpers/carthelper')
const voucher_codes = require('voucher-code-generator')
const Coupon = require('../models/couponschema')
const bcrypt = require('bcryptjs')
const multer = require('multer')
const session = require('express-session')
const { default: mongoose } = require('mongoose')
const orderHelpers = require('../helpers/orderHelpers')
const salesHelpers = require('../helpers/salesHelpers')

let category;
let errMessage="";
let response={};




//storage
const storage = multer.diskStorage({
    destination: function(req, file , cb){
      return cb (null, "./public/uploads")
    },
    filename : function(req, file , cb){
      return cb (null, `${Date.now()}-${file.originalname}`) 
}
})

const upload = multer({storage})

const getAdmin = (req,res)=>{
   try {
    if(req.session.adminLoggedIn){
        res.redirect('/admin/adminhome')
       }
       else{
        res.render('admin/adminlogin',{admins:true,adminheader:true,response})
        response.message=""
        response.email=""
       }
   } catch (error) {
    console.log(error)
    res.status(500).render('user/error', { message: "An error occurred while processing your request." });
   }
}

const getAdminHome = async(req,res)=>{
   try {
    if(req.session.adminLoggedIn){
        let orderTotal=await orderHelpers.orderTotal()
        let order = await Order.find({deliveryStatus:"order delivered"})
        let product = await Product.find()
        let category = await Category.find({deleted:false})
        let totalSales = await salesHelpers.totalSales();
      
        let orderBasedOnMonths = await salesHelpers.allOrderBasedOnMonths()
        let cancelledOrders =await salesHelpers.cancelledOrders()
        let returnedOrders = await salesHelpers.returnedOrders()
        let monthlySales = await salesHelpers.monthSales()
        let monthTotal = await salesHelpers.monthlyTotal()
       
        res.render('admin/adminhome',{admins:true,orderTotal,order,product,category,totalSales,
            orderBasedOnMonths,
            cancelledOrders,
            returnedOrders,
            monthlySales,monthTotal})
    }
    else{
        res.redirect('/admin/adminlogin')
    } 
   } catch (error) {
    console.log(error)
    res.status(500).render('user/error', { message: "An error occurred while processing your request." });

   } 
}



const salesReport =async (req,res)=>{
   try {
    let render = false;
    let weeklyReport = await salesHelpers.weeklySales();
    let weekTotal = await salesHelpers.weekTotal();
    let monthlySales = await salesHelpers.monthlySales()
    let monthTotal = await salesHelpers.monthlyTotal()
    let yearlySales =await salesHelpers.yearlySales()
    let yearTotal = await salesHelpers.yearTotal()
    if(weeklyReport.length > 0){
        render = true;
    }
    res.render('admin/salesreport',
       {admins:true,
        weeklyReport,
        weekTotal,
        monthlySales,
        monthTotal,
        yearlySales,
        yearTotal,
        render
    })
   } catch (error) {
    console.log(error)
    res.status(500).render('user/error', { message: "An error occurred while processing your request." });
   }
}


const adminLogin = async(req,res)=>{
    const {email,password} = req.body 
    try{
    const admins= await Admin.findOne({email:email})
    if(admins){
    const passwordCorrect=await bcrypt.compare(password,admins.password)
    if(!passwordCorrect)
        {
        response.status = false
        response.email=email
        response.message = "invalid password"
        res.redirect('/admin')
        }
    else{
        response.status = true
        response.admin = admins
        req.session.admin=response
        req.session.adminLoggedIn = true
        res.redirect('/admin/adminhome')}  
        }
    else{
        response.status = false
        response.message = "invalid email"
        response.email = email
        res.redirect('/admin')
        }
}
catch(e){
    console.log(e)
    res.status(500).render('user/error', { message: "An error occurred while processing your request." });
}
}

const userdetails = async(req,res)=>{
    try {
        if(req.session.adminLoggedIn){
            const users= await User.find()
             res.render('admin/userdetails',{users,admins:true,errMessage})
             errMessage=""
         }
         else{
             res.redirect('/admin/adminlogin')
         } 
    } catch (error) {
        console.log(error)
        res.status(500).render('user/error', { message: "An error occurred while processing your request." }); 
    }
}

const userBlock = async(req,res)=>{
   try {
    const id = req.params.id
    await User.findByIdAndUpdate(id,{$set:{isBlocked:true}})
    errMessage = "successfully blocked"
    res.redirect('/admin/userdetails')
   } catch (error) {
    console.log(error)
    res.status(500).render('user/error', { message: "An error occurred while processing your request." }); 
   }
}

const userUnblock = async(req,res)=>{
   try {
    const id = req.params.id
    await User.findByIdAndUpdate(id,{$set:{isBlocked:false}})
    errMessage = "successfully unblocked"
    res.redirect('/admin/userdetails')
   } catch (error) {
    console.log(error)
    res.status(500).render('user/error', { message: "An error occurred while processing your request." }); 
   }
}

const addProduct=async(req,res)=>{
   try {
    category =await Category.find()
    res.render('admin/adminproducts',{admins:true,category})
   } catch (error) {
    console.log(error)
    res.status(500).render('user/error', { message: "An error occurred while processing your request." }); 
   }  
}
const productInfo =  async(req,res)=>{
   try {
    const response=await Product.find()
    res.render('admin/productInfo',{admins:true,response})
   } catch (error) {
    console.log(error)
    res.status(500).render('user/error', { message: "An error occurred while processing your request." }); 
   }
}

const postAddProduct= (req,res)=>{

       upload.array('image',5)(req, res, async (err) => {
            if (err) {
              console.log(err);
              return next(err);
            }
          try{
            const newProduct = new Product({
                brand: req.body.brand,
                productName: req.body.productname,
                category:req.body.category,
                price: req.body.price,
                offPrice:req.body.dealprice,
                quantity:req.body.stock,
                images: req.files.map(file => file.filename),
                description:req.body.Description,
                strapColour:req.body.strapColour,

            });
        
           await Product.create(newProduct);
         
           
          }catch(error){
          console.log(error)
          res.status(500).render('user/error', { message: "An error occurred while processing your request." }); 
          }});
          res.redirect('/admin/productInfo') 
          }
         
const getEditProduct = async(req,res)=>{
   try {
    let id = req.params.id
    let product=await Product.findById(id)
    let category = await Category.find()
    res.render('admin/editproducts',{product,admins:true,category})
   } catch (error) {
    console.log(error)
          res.status(500).render('user/error', { message: "An error occurred while processing your request." }); 
   }
}          

          
const putEditProduct = async(req,res)=>{
    upload.array('image',5)(req, res, async (err) => {
        if (err) {
            console.log(err);
            return next(err);
          } 
        try{
            let id = req.params.id
            let item = req.body
            if(req.files.length > 1){
                   await Product.findOneAndUpdate({_id:id},{$set:{
                    brand: item.brand,
                    productName: item.productname,
                    category:item.category,
                    price: item.price,
                    offPrice:item.dealprice,
                    quantity:item.stock,
                    description:item.Description,
                    images: req.files.map(file => file.filename),
                    strapColour:item.strapColour,
                }
          })
            }else{ 
                    await Product.findOneAndUpdate({_id:id},{$set:{
                    brand: item.brand,
                    productName: item.productname,
                    category:item.category,
                    price: item.price,
                    offPrice:item.dealprice,
                    quantity:item.stock,
                    description:item.Description,
                    images:item.images,
                    strapColour:item.strapColour,
                     }})} 
                    res.redirect('/admin/productInfo')}
                    catch(error)
                    {
                    console.log(error)
                    res.status(500).render('user/error', { message: "An error occurred while processing your request." }); 
                    }})}


const deleteProduct =async (req,res)=>{
   try {
    let id = req.params.id
    await Product.findOneAndUpdate({_id:id},{$set:{deleted:true}}) 
    res.redirect('/admin/productInfo')
   } catch (error) {
    console.log(error)
                    res.status(500).render('user/error', { message: "An error occurred while processing your request." }); 
   }
}
const listProduct= async(req,res)=>{
    try {
        let id = req.params.id
        await Product.findOneAndUpdate({_id:id},{$set:{deleted:false}})
        res.redirect('/admin/productInfo') 
    } catch (error) {
        console.log(error)
        res.status(500).render('user/error', { message: "An error occurred while processing your request." });   
    }
   
}

const addCategory =async (req,res)=>{
  try {
    const category = await Category.find()
    res.render('admin/addcategory',{admins:true,category,errMessage})
    errMessage=""
  } catch (error) {
    console.log(error)
    res.status(500).render('user/error', { message: "An error occurred while processing your request." });   
  }

}
const postCategory =async(req,res)=>{
 try {
    let  enteredcat=req.body.category
    let catexist = await Category.find({category:enteredcat})
      const newCategory = new Category({
          category:req.body.category
      })
       if(catexist.length>0){
         errMessage="category already exists"
          res.redirect('/admin/category')
       }
      else{
          newCategory.save()
         res.redirect('/admin/category')}
 } catch (error) {
    console.log(error)
    res.status(500).render('user/error', { message: "An error occurred while processing your request." });     
 }
    }

  const editCategory = async(req,res)=>{
    try {
        let categoryId = req.params.id
    categoryId= new mongoose.Types.ObjectId(categoryId)
    let category=await Category.find({_id:categoryId}) 
    res.render('admin/editCategory',{category,errMessage,admins:true})
    } catch (error) {
        console.log(error)
        res.status(500).render('user/error', { message: "An error occurred while processing your request." });     
    }
}

  const putEditCategory = async(req,res)=>{
    try {
        let categoryId = req.body.categoryId
        let categoryname = req.body.category
        categoryId = new mongoose.Types.ObjectId(categoryId)
        await Category.findOneAndUpdate({_id:categoryId},{$set:{category:categoryname}})
        res.json({status:true})
        
    } catch (error) {
        console.log(error)
        res.status(500).render('user/error', { message: "An error occurred while processing your request." });         }
}
  
const deleteCategory = async (req,res)=>{
    let categoryId = req.body.categoryId
        categoryId = new mongoose.Types.ObjectId(categoryId)    
    try {    
    await Category.findByIdAndUpdate({_id:categoryId},{$set:{deleted:true}})
    res.json({status:true}) 
    } catch (error) {
        console.log(error)
        res.status(500).render('user/error', { message: "An error occurred while processing your request." });         }
}

const listCategory = async(req,res)=>{
try {
    let categoryId = req.body.categoryId
categoryId = new mongoose.Types.ObjectId(categoryId)
await Category.findByIdAndUpdate({_id:categoryId},{deleted:false})
res.json({status:true})

} catch (error) {
    console.log(error)
    res.status(500).render('user/error', { message: "An error occurred while processing your request." });     }
}

const orderManagement = async(req,res)=>{
  try {
    let orders= await Order.find().populate('userId','name email mobile').sort({createdAt:-1})
    res.render('admin/ordermanagement',{orders,admins:true})
  } catch (error) {
    console.log(error)
    res.status(500).render('user/error', { message: "An error occurred while processing your request." });     }
  }


const getOrderDetails =async (req,res)=>{
   try {
    let orderId = req.params.id
    orderId = new mongoose.Types.ObjectId(orderId)
    let order = await Order.findOne({"_id":orderId})
  
    let deliveryDetails = order.deliveryDetails
    
    let productInfo = order.products
    
    res.render('admin/orderDetailsPage',{admins:true,order,deliveryDetails,productInfo})
   } catch (error) {
    console.log(error)
    res.status(500).render('user/error', { message: "An error occurred while processing your request." });     }   }


const changeStatus =async(req,res)=>{
try {
let status = req.body.status
let orderId = req.body.orderId
let itemId = req.body.itemId
let userId = req.body.userId
let productId = req.body.productId
let quantity = req.body.quantity
let refundAmount = req.body.refundAmount
refundAmount = parseInt(refundAmount)
itemId = new mongoose.Types.ObjectId(itemId)
orderId = new mongoose.Types.ObjectId(orderId)
let order = await Order.findOne({ _id: orderId });
    const itemIndex = order.products.findIndex((item) => item._id.equals(itemId));
    // Update the deliveryStatus of the specific item
    if (itemIndex !== -1) {
      order.products[itemIndex].deliveryStatus = status;
      if(status==="Delivered"){order.products[itemIndex].paymentStatus = "paid";order.products[itemIndex].deliveredTimeStamp=new Date()}
      else if(status==="Returned"){order.products[itemIndex].paymentStatus = "amount returned"; await Wallet.updateOne({userId:userId},{$inc:{walletAmount:refundAmount}});await orderHelpers.increaseStock(productId,quantity)}
      else if(status==="Cancelled"){order.products[itemIndex].paymentStatus = "cancelled"; await Wallet.updateOne({userId:userId},{$inc:{walletAmount:refundAmount}});await orderHelpers.increaseStock(productId,quantity)}
      else{order.products[itemIndex].paymentStatus = "pending"}
    }
    order.products.forEach((item)=>{
        if(item.paymentStatus==="paid"){
            order.deliveryStatus = "order delivered"
        }
        else if(item.paymentStatus==="amount returned"){
            order.deliveryStatus = "order returned"
        }
        else if(item.paymentStatus==="cancelled"){
            order.deliveryStatus="order cancelled"
        }
        else{
            order.deliveryStatus = "order processing"
        }
    })
    // Save the updated order document
    await order.save();
    res.json({status:true})
} catch (error) {
    console.log(error)
    res.status(500).render('user/error', { message: "An error occurred while processing your request." });     }
}

const couponPage = async(req,res)=>{
    try {
        let coupon = await Coupon.find() 
 res.render('admin/couponPage',{admins:true,coupon})
    } catch (error) {
        console.log(error)
        res.status(500).render('user/error', { message: "An error occurred while processing your request." });     }
}

const postCoupon = async(req,res)=>{
try {
    const {discount,minPurchase,maxPurchase,expires}=req.body
const voucher = voucher_codes.generate({           
    length: 7,
    charset: voucher_codes.charset("alphabetic"),
  });
   let code = voucher.toString()
let newCoupon = new Coupon({
couponCode:code,
discount:discount,
minPurchase:minPurchase,
maxPurchase:maxPurchase,
expires:expires,
statusEnable:true
})
await newCoupon.save()
res.redirect('/admin/coupon-Management')

} catch (error) {
    console.log(error)
    res.status(500).render('user/error', { message: "An error occurred while processing your request." });     }
}

const changeStatusCoupon = async (req,res)=>{
try {
    console.log(req.body.id)
let id = req.body.id
id = new mongoose.Types.ObjectId(id)
let couponSelected = await Coupon.findOne({"_id":id})
if(couponSelected.statusEnable){await Coupon.findOneAndUpdate({"_id":id},{$set:{statusEnable:false}})}
else{await Coupon.findOneAndUpdate({"_id":id},{$set:{statusEnable:true}})}
res.json({status:true})
} catch (error) {
    console.log(error)
    res.status(500).render('user/error', { message: "An error occurred while processing your request." });     }

}
const getCouponEditModal = async (req,res)=>{
try {
    
let id = req.body.id
id = new mongoose.Types.ObjectId(id)
let response=await Coupon.find({"_id":id})
response = response[0]
res.json(response)
} catch (error) {
    console.log(error)
    res.status(500).render('user/error', { message: "An error occurred while processing your request." });     }
}

const editCoupon = async(req,res)=>{
    try {
        let {couponCode,discount,minPurchase,expires,couponId}= req.body
        couponId = new mongoose.Types.ObjectId(couponId)
        console.log(couponId)
        await Coupon.findOneAndUpdate({"_id":couponId},{$set:{couponCode:couponCode,discount:discount,minPurchase:minPurchase,expires:expires}}).then((result) => {
            res.json({status:true})
        }).catch((err) => {
            console.log(err)
            res.status(500).render('user/error', { message: "An error occurred while processing your request." });     });
       
    } catch (error) {
        console.log(error)
        res.status(500).render('user/error', { message: "An error occurred while processing your request." });     }
}

 const bannerPage = (req,res)=>{
try {
    res.render('admin/banner',{admins:true})
 
} catch (error) {
    console.log(error)
    res.status(500).render('user/error', { message: "An error occurred while processing your request." });     } } 

 const postBanner =async (req,res)=>{
    
    upload.array('imageUrl',5)(req, res, async (err) => {
        if (err) {
          console.log(err);
          return res.json({status:false}) 
        }
      try{
        const newBanner = {
            imageUrl: req.files.length > 0 ? req.files[0].filename : 'assets/images/banner.jpg',
            link: req.body.link,
            altText: req.body.altText,
            title: req.body.title,
            description: req.body.description,
            startDate: new Date(req.body.startDate),
            endDate: new Date(req.body.endDate), 
     }
     let newAddBanner= new Banner(newBanner)
     newAddBanner.save()
    return res.json({status:true})
       
      }catch(error){
        console.log(error);
        return res.json({status:false})
      }});   
}
 const viewBanners = async(req,res)=>{
   let bannerdata= await Banner.find()
   res.render('admin/viewbanner',{admins:true, bannerdata})
 }

 const deleteBanner = async(req,res)=>{
 try {
    let id = req.body.id
 id = new mongoose.Types.ObjectId(id)
 await Banner.deleteOne({"_id":id})
 res.json({status:true})
 } catch (error) {
    console.log(error)
    res.status(500).render('user/error', { message: "An error occurred while processing your request." });     } 
 }

 const bannerModal =async (req,res)=>{
try {
    let id = req.query.id
id = new mongoose.Types.ObjectId(id)
let response=await Banner.findOne({"_id":id})
res.json(response)
} catch (error) {
    console.log(error)
    res.status(500).render('user/error', { message: "An error occurred while processing your request." });     } 
 }

 const editBanner = async(req,res)=>{
   try {
    const {link,altText,title,description,startDate,endDate,couponId}=req.body
    
    id = new mongoose.Types.ObjectId(couponId)
    await Banner.findOneAndUpdate({"_id":id},{$set:{link:link,altText:altText,title:title,description:description,startDate:startDate,endDate:endDate,}}).then(()=>{
        res.json({status:true})
    })
   } catch (error) {
    console.log(error)
    res.status(500).render('user/error', { message: "An error occurred while processing your request." });     } 
 }
    


const logOut = (req,res)=>{
    try {
        if(req.session.adminLoggedIn){
            req.session.adminLoggedIn = false
            req.session.destroy()
            res.redirect('/admin')
            }
            else{ 
                console.log('not logged in')
            }  
    } catch (error) {
        console.log(error)
        res.status(500).render('user/error', { message: "An error occurred while processing your request." });     } 
    } 

module.exports={
    getAdmin,
    adminLogin,
    getAdminHome,
    salesReport,
    userdetails,
    logOut,
    userBlock,
    userUnblock,
    addProduct,
    productInfo,
    postAddProduct,
    getEditProduct,
    putEditProduct,
    deleteProduct,
    listProduct,
    addCategory,
    postCategory,
    editCategory,
    putEditCategory,
    deleteCategory,
    listCategory,
    orderManagement,
    getOrderDetails,
    changeStatus,
    couponPage,
    postCoupon,
    changeStatusCoupon,
    getCouponEditModal,
    editCoupon,
    bannerPage,
    postBanner,
    viewBanners,
    deleteBanner,
    bannerModal,
    editBanner
}
