const bcrypt = require('bcryptjs')
const User = require('../models/loginschema');
const Product = require('../models/productSchema');
const Category=require('../models/categoryschema');
const Address = require('../models/adressSchema');
const Wishlist = require('../models/wishlist')
const Cart = require('../models/cartSchema')
const Coupon = require('../models/couponschema')
const Orders = require('../models/orderSchema');
const Wallet = require('../models/walletSchema') 
const Banner = require('../models/bannerSchema')



const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const session = require('express-session');


const cartController = require('../controller/cartcontroller')
const cartHelper = require('../helpers/carthelper');
const orderHelpers = require('../helpers/orderHelpers');
const addressHelpers = require('../helpers/addressHelper')
const searchHelpers = require('../helpers/searchHelper')
const Razorpay = require('razorpay'); 

const { response } = require('express');
const banner = require('../models/bannerSchema');

var instance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});


const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifySid = process.env.TWILIO_SERVICE_SSID; 

const client = require('twilio')(accountSid, authToken);
let errMessage =""
let userdata;
let productId;

//------------- homepageget--------------

const homePage = async(req,res)=>{ 
  try {
    let  productData=await Product.find() 
    let cart = await Cart.find()
    let banner= await addressHelpers.validBanner()
    let userId = req.session.userId
    res.render('user/home',{header:true,userdata,productData,cart,userId,banner})  
    userId="" 
  } catch (error) {
    res.status(500).render('user/error', { message: "An error occurred while processing your request." });
 
  } 
}

// ----------loginmodalget-----------

const getLoginRegister = (req,res)=>{
    try {
        if(req.session.logged){
            res.redirect('/')
        }
        else{
            errMessage="";
            res.render('user/userlogin',{errMessage,userdata})
           
        } 
    } catch (error) {
        res.status(500).render('user/error', { message: "An error occurred while processing your request." });

    }
   
}
const getRegister = (req,res)=>{
try {
    res.render('user/register',{errMessage})

} catch (error) {
    res.status(500).render('user/error', { message: "An error occurred while processing your request." });
 
}}

// --------regiterpost--------

const postRegister = async(req,res)=>{
    try{
        const {name,email,mobile,password}=req.body;
        console.log(req.body,"reqbody")
        let userExist = await User.findOne({$or:[{email:email},{mobile:mobile}]}) 
        if(!userExist){
            req.session.body = req.body;
            const mob = req.body.mobile;
            req.session.mobile = mob;
            await client.verify.v2.services(verifySid).verifications.create({to: `+91${mob}`, channel: "sms" });
            res.json({status:true}) 
        }   
         else{
            errMessage="email or mobile already exists"
            res.json({status:false,errMessage:errMessage})
            errMessage=""
        }
    }catch(e){
        res.status(500).render('user/error', { message: "An error occurred while processing your request." });
    }   
}

const getOtp = (req,res)=>{
try {
    res.render('user/otpfirst')

} catch (error) {
    res.status(500).render('user/error', { message: "An error occurred while processing your request." });

}}

const validateOtp = async(req,res)=>{
    const {otp} = req.body
    const mob = req.session.mobile
    const {name,email,mobile,password}= req.session.body
    
    try{
        let response = await client.verify.v2.services(verifySid ).verificationChecks.create({ to: `+91${mob}`, code: otp })
        if(response.valid){  
          const hashPass=await bcrypt.hash(password,10)
          const newUser = new User({name:name,email:email,mobile:mobile,password:hashPass})
          req.session.logged = true
          newUser.save().then(async()=>{
            let userfound=await User.findOne({email:email})
            req.session.userId=userfound._id
            const newWallet = new Wallet({walletAmount:0,userId:req.session.userId})
            newWallet.save()
          })
          res.redirect('/') 
        }
        else{
            res.redirect('/otpfirst')
        }
    }catch(e){
        res.status(500).render('user/error', { message: "An error occurred while processing your request." });
    }
}



// -------loginpost---------

const postLogin = async(req,res)=>{
    try{
        const {email,password}=req.body
       
        const userExist = await User.findOne({email:email})
       
        if(userExist&&!userExist.isBlocked){
          bcrypt.compare(password,userExist.password).then((result)=>{
            if(result){
                req.session.logged=true
                req.session.userId=userExist._id
                userdata=req.session.logged
                res.json({status:true})
            } else{
                errMessage = "invalid password"
               res.json({status:false,message:"invalid password"})
            }
        })  
      }
      else{
        if(!userExist){ 
           
        res.json({status:false,message:"email is not registered"})
    }
    else{
        res.json({status:false,message:"This user is blocked"})
    }  
      }
    }catch(e){
        res.status(500).render('user/error', { message: "An error occurred while processing your request." });
    }
  
}

//  ---------------CART----------------




const addCart = async(req,res)=>{
    try {
        const productId = req.params.id
        console.log(productId)
        let ObjectId = new mongoose.Types.ObjectId(productId) 
        let productData=await Product.findOne({_id:ObjectId})
        console.log(productData)
        
        let cartobject = [{
            brand:productData.brand,
            quantity:productData.quantity,
            productname:productData.productName,
            productnetprice:productData.offPrice   
        }]
      let  userid=req.session.userId

      let cartItem = new Cart({
        product:cartobject,
        userId:userid
      })
        
                 await Cart.create({cartItem})
                 cartItem.save() 
                 res.redirect('/product/:ObjectId')
                
             
      } catch (error) {
        console.error(error);
        res.status(500).render('user/error', { message: "An error occurred while processing your request." });
      }
    }
      
const getWishlist = async(req,res)=>{
    try {
        let userId = req.session.userId
let userdata = await User.findOne({userId:userId})
let wishlistData = await Wishlist.findOne({userId:userId})

    res.render('user/wishlist',{header:true,userdata,wishlistData}) 
    } catch (error) {
        console.log(error)
        res.status(500).render('user/error', { message: "An error occurred while processing your request." });
    }
}

const postWishlist =async (req,res)=>{
try {
    let userId = req.session.userId
    console.log(typeof(userId))
let userdata = await User.findOne({userId:userId})
let productId = req.body.productId
productId = new mongoose.Types.ObjectId(productId)
let productData =  await Product.findOne({_id:productId})
let wishlistData = await Wishlist.findOne({userId:userId})
console.log(wishlistData,"wishlistdataaa")
 
if(!wishlistData){
    if(typeof(userId)==="undefined"){res.json({status:"4"})}
    else{
 
            let wishlistProduct=new Wishlist({
            userId:userId,
            product:[{
            productname:productData.productName,
            brand:productData.brand,
            image:productData.images[0],
            productId:productData._id.toString()
        }]
        })
            wishlistProduct.save() 
            res.json({status:"1"}) 
        }}
        else{
             console.log('in else')
    
   let alreadyExist= wishlistData.product.findIndex((product)=>{return product.productId === productData._id.toString()})
        console.log(alreadyExist)
         if(alreadyExist!==-1){
         res.json({status:"2"})
         }else{
         await Wishlist.updateOne({userId:userId},{$push:{product:[{ productname:productData.productName,
        brand:productData.brand,
        image:productData.images[0],
        productId:productData._id.toString()}]}})
        res.json({status:"3"}) 
   } 
} 
} catch (error) {
    console.log(error)
    res.status(500).render('user/error', { message: "An error occurred while processing your request." });

}
}

const removeWishList = async(req,res)=>{
    try {
        const userId = req.session.userId
 let wishlistDataId = req.body.wishlistDataId
 wishlistDataId=new mongoose.Types.ObjectId(wishlistDataId)
 await Wishlist.updateOne({userId:userId},{$pull:{product:{_id:wishlistDataId}}})
 res.json({status:true})
    } catch (error) {
        console.log(error)
        res.status(500).render('user/error', { message: "An error occurred while processing your request." });

    }
}


const getCheckout =async (req,res)=>{
   try {
    let userId = req.session.userId
    
    cartHelper.getCartProducts(userId).then(async(cartItems)=>{
        let cartTotal = await  cartHelper.getCartTotal(userId)      
        let addressData=await Address.findOne({user:userId})
        let coupon = await Coupon.find({"statusEnable":true})
        let wallet = await Wallet.findOne({userId:userId}) 
    res.render('user/checkout',{header:true,userdata:true,cartTotal,cartItems,addressData,coupon,wallet})
       
})
   } catch (error) {
    console.log(error) 
    res.status(500).render('user/error', { message: "An error occurred while processing your request." });

   }
}



const postCheckOut = async (req,res)=>{
         try {
        const userId = req.session.userId
        console.log(userId,"user id in checkout page");
        const paymentOption = req.body.payment_option
        console.log('in razorpay')
        let addressId = req.body.addressSelect;
        let discountAmount = req.body.discountAmount
        let discount = req.body.discount
        let totals = req.body.Totals
        console.log(discountAmount,"discountAmount")
       
         let paymentStatus = paymentOption === "COD" ? 'pending' : 'paid';
         let deliveryStatus = paymentStatus === "pending" ? 'OrderProcessing' : 'Order Confirmed'
           
        let cartProducts=await Cart.findOne({userId:userId})
       let cartProductData = cartProducts.product
   
        for(let i=0;i<cartProducts.length;i++){
          paymentStatus = cartProducts.product[i].paymentStatus
        }
       
       
        let cartTotal = await cartHelper.getCartTotal(userId)
        console.log(cartTotal,"total in place order");
        let wallet = await Wallet.findOne({userId:userId}) 
        let walletAmount=wallet.walletAmount
        console.log(walletAmount)

        
        
        addressId=new mongoose.Types.ObjectId(addressId) 
        let allAddress = await Address.findOne({user:userId}) 
       
       let addressfind=allAddress.address.find(address=>{return address._id.toString()===addressId.toString()})
        

        if(paymentOption==='COD'){
            let orderId = await orderHelpers.generateUniqueID()
            await orderHelpers.placeOrder(addressfind,paymentOption,paymentStatus,deliveryStatus,userId,cartProductData,cartTotal,orderId,discountAmount,discount,totals).then(async(order)=>{

            await Cart.findOneAndRemove({userId:userId}).then(()=>{cartProductData.forEach((element)=>{    orderHelpers.decreaseStock(element.productId,element.quantity)}) })
                
               res.json({COD:true})})
               }
               
            else if(paymentOption==='Razorpay'){ 
                let orderId = await orderHelpers.generateUniqueID()
               
                await orderHelpers.placeOrder(addressfind,paymentOption,paymentStatus,deliveryStatus,userId,cartProductData,cartTotal,orderId,discountAmount,discount,totals).then(async(order)=>{           
                orderHelpers.generateRazorPay(order._id,discountAmount).then(async(order)=>{
                res.json(order)

               })})     
             }
             else if(paymentOption==="wallet"){
                if(walletAmount>=cartTotal[0].total){
                    let orderId = await orderHelpers.generateUniqueID()
                await orderHelpers.placeOrder(addressfind,paymentOption,paymentStatus,deliveryStatus,userId,cartProductData,cartTotal,orderId,discountAmount,discount,totals).then(async(order)=>{
                    await Wallet.findOneAndUpdate({userId:userId},{$inc:{walletAmount:-(discountAmount)}}) 

                    await Cart.findOneAndRemove({userId:userId}).then(()=>{cartProductData.forEach((element)=>{    orderHelpers.decreaseStock(element.productId,element.quantity)});
                    res.json({wallet:true})
                })})}else{
                    res.json({wallet:false,message:"insufficient wallet amount"})
                }
                
             }
    } catch (error) {
        console.log(error)
        res.status(500).render('user/error', { message: "An error occurred while processing your request." });

    }
 }

 const verifyPayment = async(req,res)=>{
   try {
    const userId = req.session.userId;
    let cartProducts=await Cart.findOne({userId:userId})
    let cartProductData = cartProducts.product


    orderHelpers.verifyPayment(req.body).then(async (response)=>{
      let cartItems=await Cart.findOne({userId:userId})
      cartItems.product.forEach(element=>{orderHelpers.decreaseStock(element.productId,element.quantity)})
      await Cart.findOneAndRemove({userId:userId})
         res.json({ status: true })       
    }).catch(async ()=>{
      res.json({ status: false, errMes: 'payment failed' })
})
   } catch (error) {
    res.status(500).render('user/error', { message: "An error occurred while processing your request." });

   }
}

const verifyCoupon =async(req,res)=>{
   try {
    let userId = req.session.userId
    console.log(req.body)
    let couponCode = req.body.couponCode
    let couponExist=await Coupon.findOne({couponCode:couponCode})
    console.log(couponExist)
 
     
    if(couponExist){
        let discount = couponExist.discount
    let cartTotal = await cartHelper.getCartTotal(userId,discount)
    let carttotal = cartTotal[0].total

    if(carttotal<couponExist.minPurchase){
        res.json({status:false,message:"purchase amount is less"})
    }else if(carttotal>couponExist.maxPurchase){
        res.json({status:false,message:"purchase amout is too high"})
    }
   
    else  {
        const cart = await Cart.findOne({ userId: userId });
        if (cart.discountApplied) {
           return res.json({ status: false, message: "Discount already applied." });
          
        }else{
            discount = carttotal*discount/100
            await Cart.updateOne({userId:userId},{$set:{discount:discount,discountApplied:true}})
            res.json({status:true,message:"discount successfully added"})
        }  
    }
    
    }
    else{
        res.json({status:false,message:"enter a valid coupon"})
    }
   } catch (error) {
    res.status(500).render('user/error', { message: "An error occurred while processing your request." });

   }
    
}


   
const orderSuccessPage = (req,res)=>{
try {
    res.render('user/successpage')

} catch (error) {
    res.status(500).render('user/error', { message: "An error occurred while processing your request." });
  
}}


const productPage =async (req,res)=>{
    try{
        let userId = req.session.userId;
        let id = req.params.id
        console.log(id)
        console.log(typeof(id),"beforeeeeee")
        let Id = new mongoose.Types.ObjectId(id)
        console.log(typeof(id),"afterrrrr")
        let  productData= await Product.findOne({"_id":Id})
        console.log(productData,"productdataaaa")   
        let allProducts = await Product.find() 
        res.render('user/userproduct',{header:true,userdata, productData,allProducts})   
    }catch(error){   
        console.log(error); 
        res.status(500).render('user/error', { message: "An error occurred while processing your request." });
       
    }     
}


const getUserProfile =async (req,res)=>{
   try {
    let id = new ObjectId(req.session.userId)
    let userId = id.toString()
    userdata=await User.findOne({_id:id}) 
    let addressData = await Address.findOne({user:id})
    let wallet = await Wallet.findOne({userId:id.toString()})
    console.log(wallet)
     res.render('user/myAccount',{header:true,userdata,addressData,errMessage,wallet})
   } catch (error) {    
    console.log(error) 
    res.status(500).render('user/error', { message: "An error occurred while processing your request." });

   }
    }
    

    const editprofile =async (req,res)=>{
        try {
            let userId=req.session.userId
            const email =req.query.email
            const name = req.query.name
            const mobile = req.query.mobile
            await User.findByIdAndUpdate({_id:userId},{$set:{name:name,email:email,mobile:mobile}})
             res.redirect('/userprofile')
        } catch (error) {
            console.log(error) 
            res.status(500).render('user/error', { message: "An error occurred while processing your request." });

        }
    }

    const changePassword = async(req,res)=>{
   try {
    let userId = req.session.userId
    userId = new mongoose.Types.ObjectId(userId)
    let currentPassword = req.body.current
    let newPassword = req.body.newPassword
  let userdetails = await User.findOne({"_id":userId})
 let passwordCorrect= await bcrypt.compare(currentPassword,userdetails.password)
 let newpassword= await bcrypt.hash(newPassword,10)
 if(passwordCorrect){
    await User.updateOne({"_id":userId},{$set:{"password":newpassword}})
    res.json({status:true})
    }
else{res.json({status:false})}
 
   } catch (error) {
    res.status(500).render('user/error', { message: "An error occurred while processing your request." });
   }
    }

    const forgotPassword = async (req,res)=>{
       try {
        let mob = req.body.mobile
        await client.verify.v2.services(verifySid).verifications.create({to: `+91${mob}`, channel: "sms" }) 
        req.session.mobile=mob
            res.redirect('/reset-Password') 
       } catch (error) {
        res.status(500).render('user/error', { message: "An error occurred while processing your request." });

       }    
    } 
   

    const resetPassword = (req,res)=>{
        try {
            res.render('user/forgotOtp',{errMessage})
        errMessage="" 
        } catch (error) {
            res.status(500).render('user/error', { message: "An error occurred while processing your request." });   
        }
    }

    const newPasswordPage = (req,res)=>{
try {
    res.render('user/newpassword')

} catch (error) {
    res.status(500).render('user/error', { message: "An error occurred while processing your request." });   

}    }
   
    const postNewPassword = async(req,res)=>{
        try {
           
       let mob = req.session.mobile
       mob = parseInt(mob)
       let otp = req.body.otp
       console.log(mob,"mobile")
       console.log(otp,"otp")
      let response=await client.verify.v2.services(verifySid ).verificationChecks.create({ to: `+91${mob}`, code: otp })
       if(response.valid){
        res.redirect('/new-Password')
       } 
       else{ 
        res.redirect('/reset-Password') 
       }     
        } catch (error) {
            console.log(error)
            res.status(500).render('user/error', { message: "An error occurred while processing your request." });   
        }
    }  

    const resendPassword = async(req,res)=>{
       try {
        let mob = req.session.mobile
        mob = parseInt(mob)
        await client.verify.v2.services(verifySid).verifications.create({to: `+91${mob}`, channel: "sms" }) 
        res.redirect('/reset-Password')
       } catch (error) {
        res.status(500).render('user/error', { message: "An error occurred while processing your request." });   

       }
        
    }
    
    const getResend = async (req,res)=>{
       try {
        let mob = req.session.mobile
        await client.verify.v2.services(verifySid).verifications.create({to: `+91${mob}`, channel: "sms" }) 
        req.session.mobile=mob
            res.redirect('/reset-Password')  
       } catch (error) {
        res.status(500).render('user/error', { message: "An error occurred while processing your request." });   

       }   
    } 

    const setNewPassword = async(req,res)=>{ 
       try {
        let mobile = req.session.mobile
        let password = req.body.password
        let newHashPassword=await bcrypt.hash(password,10)
        await User.updateOne({mobile:mobile},{$set:{password:newHashPassword}})
        req.session.mobile=""
        res.json({status:true})
       } catch (error) {
        console.log(error) 
        res.status(500).render('user/error', { message: "An error occurred while processing your request." });   

       }
    }
  
    const searchHome=(req,res)=>{
      try {
        const payload = req.body.payload.trim()
        searchHelpers.searchResult(payload).then((searchData)=>{
            res.send({ payload: searchData});
        }).catch(e=>{
            console.log(e);
        })
      } catch (error) {
        console.log(error)
        res.status(500).render('user/error', { message: "An error occurred while processing your request." });   

      } 
    }
    


const logOut = (req,res)=>{
try {
    req.session.logged = false;
    userdata=req.session.logged
    req.session.destroy()
   res.redirect('/')
} catch (error) {
    res.status(500).render('user/error', { message: "An error occurred while processing your request." });   
}
}

const errorPage = async (req,res)=>{
    try {
       res.render('user/error') 
    } catch (error) {
        res.status(500).render('user/error', { message: "An error occurred while processing your request." });   
    }
}
                
//shop 
const shop = async(req,res)=>{
    try {
        let userId = req.session.userId
        let products = await Product.find({deleted:false})
        console.log(products)
        res.render('user/shop',{products,header:true,userdata}) 
    } catch (error) {
        res.status(500).render('user/error', { message: "An error occurred while processing your request." });   
  
    }
}


 const sortSearchFilterPagination = async (req, res) => {
    try {
      const {
        selectedSort,
        selectedPriceRange,
        selectedBrand,
        searchQuery,
        selectedPage,
        selectedCategory
      } = req.query;
         console.log(req.query,"this is from query");
         console.log(selectedCategory);
  
      const sortOptions = {};
  
      if (selectedSort === "lowtohigh") {
        sortOptions["price"] = 1;
      } else if (selectedSort === "hightolow") {
        sortOptions["price"] = -1;
      }
  
      let query = {};
      const selectedBrandsArray = selectedBrand.split(',');
      if (selectedBrandsArray.includes("all brands")) {
        // If "all brands" is selected, do not filter by brand
      } else {
        query["brand"] = { $in: selectedBrandsArray };
      }
  
      if (selectedPriceRange !== "All") {
        const [minPrice, maxPrice] = selectedPriceRange.split("-").map(item => parseInt(item, 10));
        query["price"] = { $gte: minPrice, $lte: maxPrice };
      }
      
  
      if (searchQuery) {
        query["productName"] = { $regex: new RegExp(searchQuery, "i") };
      }
      const selectedCategoryArray = selectedCategory.split(',');
      if (selectedCategoryArray.includes("all category")) {
        // If "all brands" is selected, do not filter by brand
      } else {
        query["category"] = { $in: selectedCategoryArray};
      }
  
      const totalCount = await Product.countDocuments(query);
  
      // Calculate skip and limit for pagination
      const skip = (parseInt(selectedPage) - 1) * 6; // Assuming 10 products per page
      const limit = 6; // Number of products per page
  
      // Fetch the products based on the query
      const products = await Product.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit);
  
      
  
      // Send the response as JSON with the fetched products and pagination details
      res.json({
        totalProducts: totalCount,
        currentPage: parseInt(selectedPage),
        totalPages: Math.ceil(totalCount / limit),
        products,
      });
    } catch (err) {
      console.log(err);
      res.status(500).render('user/error', { message: "An error occurred while processing your request." });   
      }
  }
     
module.exports ={
    shop,
    homePage,
    getLoginRegister,
    postRegister,
    postLogin,
    getWishlist,
    postWishlist,
    removeWishList,
    getCheckout,
    postCheckOut,
    getOtp,
    validateOtp,
    getRegister,
    productPage,
    logOut,
    errorPage,
    getUserProfile,
    editprofile,
    addCart,
    orderSuccessPage,
    verifyPayment,
    verifyCoupon,
    changePassword,
    forgotPassword,
    resetPassword,
    postNewPassword,
    newPasswordPage,
    setNewPassword,
    sortSearchFilterPagination,
    searchHome,
    resendPassword,
    getResend,
    
}
