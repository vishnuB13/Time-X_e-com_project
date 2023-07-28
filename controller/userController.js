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
  let  productData=await Product.find() 
  let cart = await Cart.find()
  let banner= await addressHelpers.validBanner()
  let userId = req.session.userId
  res.render('user/home',{header:true,userdata,productData,cart,userId,banner})  
  userId=""  
}

// ----------loginmodalget-----------

const getLoginRegister = (req,res)=>{
    try {
        if(req.session.logged){
            res.redirect('/')
        }
        else{
            res.render('user/userlogin',{errMessage,userdata})
            errMessage="";
        } 
    } catch (error) {
        res.status
    }
   
}
const getRegister = (req,res)=>{
    res.render('user/register',{errMessage})
}

// --------regiterpost--------

const postRegister = async(req,res)=>{
    try{
        const {name,email,mobile,password}=req.body;
        let userExist = await User.findOne({$or:[{email:email},{mobile:mobile}]}) 
        if(!userExist){
            req.session.body = req.body;
            const mob = req.body.mobile;
            req.session.mobile = mob;
            await client.verify.v2.services(verifySid).verifications.create({to: `+91${mob}`, channel: "sms" });
            res.redirect('/otpfirst')
        }   
         else{
            errMessage = "user already exists"
            res.redirect('/login')
        }
    }catch(e){
        console.log(e);
    }   
}

const getOtp = (req,res)=>{
    res.render('user/otpfirst')
}

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
        console.log(e);
    }
}



// -------loginpost---------

const postLogin = async(req,res)=>{
    try{
        const {email,password}=req.body;  
        const userExist = await User.findOne({email:email})
        if(userExist&&!userExist.isBlocked){
          bcrypt.compare(password,userExist.password).then((result)=>{
            if(result){
                req.session.logged=true
                req.session.userId=userExist._id
                userdata=req.session.logged
                res.redirect('/');
            } else{
                errMessage = "invalid password"
               res.redirect('/login')
            }
        })  
      }
      else{
        if(!userExist){ 
            errMessage="invalid email"
        res.redirect('/login')
    }
    else{
        errMessage="This email is blocked"
        res.redirect('/login')
    }  
      }
    }catch(e){
        console.log(e)
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
        return res.status(500).json({ error: 'Internal server error' });
      }
    }
      
   
  


const getWishlist = async(req,res)=>{
    try {
        let userId = req.session.userId
let userdata = await User.findOne({userId:userId})
let wishlistData = await Wishlist.findOne({userId:userId})
console.log(wishlistData)

    res.render('user/wishlist',{header:true,userdata,wishlistData}) 
    } catch (error) {
        console.log(error)
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
    }
}


const getCheckout =async (req,res)=>{
   try {
    let userId = req.session.userId
    cartHelper.getCartProducts(userId).then(async(cartItems)=>{
        let cartTotal = await  cartHelper.getCartTotal(userId)      
        let addressData=await Address.findOne({user:userId})
        let coupon = await Coupon.find({"statusEnable":true}) 
    res.render('user/checkout',{header:true,userdata:true,cartTotal,cartItems,addressData,coupon})
})
   } catch (error) {
    console.log(error) 
   }
}



const postCheckOut = async (req,res)=>{
         try {
        const userId = req.session.userId
        console.log(userId,"user id in checkout page");
        const paymentOption = req.body.payment_option
        let addressId = req.body.addressSelect;
       
         let paymentStatus = paymentOption === "COD" ? 'pending' : 'paid';
         let deliveryStatus = paymentStatus === "pending" ? 'OrderProcessing' : 'Order Confirmed'
           
        let cartProducts=await Cart.findOne({userId:userId})
       let cartProductData = cartProducts.product
   
        for(let i=0;i<cartProducts.length;i++){
          paymentStatus = cartProducts.product[i].paymentStatus
        }
       
       
        let cartTotal = await cartHelper.getCartTotal(userId)
        console.log(cartTotal,"total in place order");
        
        
        addressId=new mongoose.Types.ObjectId(addressId) 
        let allAddress = await Address.findOne({user:userId}) 
       
       let addressfind=allAddress.address.find(address=>{return address._id.toString()===addressId.toString()})
        

        if(paymentOption==='COD'){
            await orderHelpers.placeOrder(addressfind,paymentOption,paymentStatus,deliveryStatus,userId,cartProductData,cartTotal).then(async(order)=>{

            await Cart.findOneAndRemove({userId:userId}).then(()=>{cartProductData.forEach((element)=>{    orderHelpers.decreaseStock(element.productId,element.quantity)}) })
                
               res.json({COD:true})})
               }
               
            else if(paymentOption==='Razorpay'){ 
                await orderHelpers.placeOrder(addressfind,paymentOption,paymentStatus,deliveryStatus,userId,cartProductData,cartTotal).then(async(order)=>{

               console.log(order);
               orderHelpers.generateRazorPay(order._id,order.totalAmount).then(async(order)=>{


                   res.json(order)

               })})     
             }
    } catch (error) {
        console.log(error)
    }
 }

 const verifyPayment = async(req,res)=>{
    const userId = req.session.userId;
      console.log(req.body,"body aaaaaaaaaaaaa");
      let cartProducts=await Cart.findOne({userId:userId})
      let cartProductData = cartProducts.product


      orderHelpers.verifyPayment(req.body).then(async (response)=>{
        console.log('in verify payment response')
        let cartItems=await Cart.findOne({userId:userId})
        cartItems.product.forEach(element=>{orderHelpers.decreaseStock(element.productId,element.quantity)})
        await Cart.findOneAndDelete({userId:userId})
           res.json({ status: true })       
      }).catch(async ()=>{
        console.log("payment failedddddddd");
        res.json({ status: false, errMes: 'payment failed' })
 })
}

const verifyCoupon =async(req,res)=>{
    let userId = req.session.userId
    console.log(req.body)
    let couponCode = req.body.couponCode
    let couponExist=await Coupon.findOne({couponCode:couponCode})
    console.log(couponExist)
 
     
    if(couponExist){
        let discount = couponExist.discount
    let cartTotal = await cartHelper.getCartTotal(userId,discount)
    console.log(cartTotal)
    let carttotal = cartTotal[0].total
    
    console.log(couponExist.minPurchase) 
    if(carttotal<couponExist.minPurchase){
        res.json({status:false,message:"purchase amount is less"})
    }
    else {
       discount = carttotal*discount/100
       await Cart.updateOne({userId:userId},{$set:{discount:discount}})
       res.json({status:true,message:"discount successfully added"})
    }
    
    }
    else{
        res.json({status:false,message:"enter a valid coupon"})
    }
    
}


   
const orderSuccessPage = (req,res)=>{
    res.render('user/successPage')
}


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
       
    }     
}

const allPage = async(req,res)=>{
    try{
        let pagenumber = req.query.pagenumber||1
        console.log(req.query.pagenumber);
        console.log(req.body,"reqbodyyyy")
        
        pagenumber = parseInt(pagenumber)
        let perPage = 3

        let data = await Product.find()
        let count = data.length
        let page = Math.round (count/perPage)
        let totalProducts = await Product.find()
        .skip((pagenumber-1)*perPage)
        .limit(perPage) 

        let total = totalProducts.length
        let category = ""
        res.render('user/categoryproducts',{header:true,userdata,data,category,totalProducts,total,page,perPage})
        
    }catch(e){console.log(e)} 
}

 

const menPage =async(req,res)=>{
    try{
        let pagenumber = req.query.pagenumber||1
        console.log(req.query.pagenumber);
        pagenumber = parseInt(pagenumber)
        let perPage = 3

        let data = await Product.find({category:"men"})
        let count = data.length
        let page = Math.round (count/perPage)
        let totalProducts =await Product.find({category:"men"}).skip((pagenumber-1)*perPage)
        .limit(perPage)
    
        let total = totalProducts.length
        let category = "MEN"
       
        
        res.render('user/categoryproducts',{header:true,userdata,totalProducts,data,category,total,page,perPage})
        
    }catch(e){console.log(e)} 
}
const womenPage =async(req,res)=>{
    try{
        let pagenumber = req.query.pagenumber||1
        console.log(req.query.pagenumber);
        pagenumber = parseInt(pagenumber)
        let perPage = 3
        let data = await Product.find({category:"women"})
        let category = "WOMEN"
        let count = data.length
        let page = Math.round (count/perPage)
        let totalProducts =await Product.find({category:"women"}).skip((pagenumber-1)*perPage)
        .limit(perPage)
        let total = totalProducts.length
        
        res.render('user/categoryproducts',{header:true,userdata,totalProducts,data,category,total,page,perPage})
    }catch(e){console.log(e)}
   
  }
  const childPage =async(req,res)=>{
    try{
        let pagenumber = req.query.pagenumber||1
        console.log(req.query.pagenumber);
        pagenumber = parseInt(pagenumber)
        let perPage = 3
        let data = await Product.find({category:"child"})
        let category = "CHILD"
        let count = data.length
        let page = Math.round (count/perPage)
        let totalProducts =await Product.find({category:"child"}).skip((pagenumber-1)*perPage)
        .limit(perPage)
        let total = totalProducts.length
        res.render('user/categoryproducts',{header:true,userdata,data,totalProducts,category,total,page,perPage})
    
    }catch(e){console.log(e)}
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
    throw(error)
   }
    }

    const forgotPassword = async (req,res)=>{
        let mob = req.body.mobile
        await client.verify.v2.services(verifySid).verifications.create({to: `+91${mob}`, channel: "sms" }) 
        req.session.mobile=mob
            res.redirect('/reset-Password')     
    } 
   

    const resetPassword = (req,res)=>{
        res.render('user/forgotOtp',{errMessage})
        errMessage="" 
    }

    const newPasswordPage = (req,res)=>{
        res.render('user/newpassword')
    }
   
    const postNewPassword = async(req,res)=>{
        try {
            let response={} 
       console.log(req.body)
       console.log(req.session)
       let mob = req.session.mobile
       mob = parseInt(mob)
       let otp = req.body.otp
       response=await client.verify.v2.services(verifySid ).verificationChecks.create({ to: `+91${mob}`, code: otp })
       if(response.valid){
        res.redirect('/new-Password')
       } 
       else{
       errMessage="otp incorrect" 
        res.redirect('/reset-Password') 
       }     
        } catch (error) {
            console.log(error)
            throw error  
        }
    }  

    const setNewPassword = async(req,res)=>{
       try {
        let mobile = req.session.mobile
        let password = req.body.password
        let newHashPassword=await bcrypt.hash(password,10)
        await User.updateOne({mobile:mobile},{$set:{password:newHashPassword}})
        req.session.mobile=""
        res.redirect('/login')
       } catch (error) {
        console.log(error) 
       }
    }
    const searchResult=(req,res)=>{
      try {
        const payload = req.body.payload.trim()
        searchHelpers.searchResult(payload).then((searchData)=>{
            res.send({ payload: searchData});
        }).catch(e=>{
            console.log(e);
        })
      } catch (error) {
        console.log(error)
      } 
    }
    const priceHigh = async (req,res)=>{
        let order = req.body.order
        order = parseInt(order)  
     let perPage = 3

     let data = await Product.find()
     let count = data.length
     let page = Math.round (count/perPage)
     let totalProducts = await Product.find().sort({offPrice:order})
     console.log(totalProducts,"ordered")
     let total = totalProducts.length
     let category = ""
     res.json({status:true})
    

    }


const logOut = (req,res)=>{
 req.session.logged = false;
 userdata=req.session.logged
 req.session.destroy()
res.redirect('/')
}
                

     
module.exports ={
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
    menPage,
    womenPage,
    childPage,
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
    allPage,
    searchResult,
    priceHigh
   
    
}
