const express = require('express')
const router = express.Router();
const userController = require('../controller/userController')
const middleware=require('../middlewares/authentication')
const addressController = require('../controller/addresscontroller')
const cartController = require('../controller/cartcontroller')
const orderController = require('../controller/orderController')  
   

 
router.get('/', userController.homePage) 
router.get('/login',userController.getLoginRegister)
router.post('/login',userController.postLogin) 
router.get('/register',userController.getRegister)
router.post('/register',userController.postRegister) 
router.get('/otpfirst',userController.getOtp)
router.post('/otpfirst',userController.validateOtp)
router.get('/logout',userController.logOut)
router.get('/error',userController.errorPage)  

 
router.get('/product/:id',userController.productPage)
router.get('/shop',userController.shop)
router.post('/shop',userController.sortSearchFilterPagination)

 

router.get('/wishlist',middleware.userAuth,userController.getWishlist)
router.post('/wishlist',userController.postWishlist)
router.delete('/removeWishlist',userController.removeWishList) 


router.get('/checkout',middleware.userAuth,middleware.cartCheck,userController.getCheckout)
router.post('/checkOut',middleware.cartCheck,userController.postCheckOut) 
router.post('/verify-payment',userController.verifyPayment)
router.post('/verify-coupon',userController.verifyCoupon)
 
    
   

router.get('/userprofile',middleware.userAuth, userController.getUserProfile) 
router.get('/editprofile',userController.editprofile)    
router.put('/editprofile',userController.editprofile) 
router.post('/changePassword',userController.changePassword) 
router.post('/forgot-Password',userController.forgotPassword)  
router.get('/reset-Password',userController.resetPassword)
router.post('/reset-Password',userController.postNewPassword)
router.get('/new-Password',userController.newPasswordPage)  
router.post('/new-Password',userController.setNewPassword) 
router.get('/resend-Password',userController.getResend)
router.post('resend-Password',userController.resendPassword)   


router.patch('/add-address',addressController.addAddress);
router.get('/editaddress/:id',addressController.getEditPage)
router.patch('/editaddress',addressController.putEditAddress)  
router.delete('/delete-address',addressController.deleteAddress) 
  
     
router.get('/cart',middleware.userAuth, cartController.getCart) 
 
router.put('/cart/:id', cartController.getProductId) 
router.patch('/cart/changequantity',cartController.changeQuantity) 
router.delete('/remove-item',middleware.userAuth,cartController.removeCartItem);
 
  
router.get('/successpage',userController.orderSuccessPage)
router.get('/orders',middleware.userAuth,orderController.getOrderPage)
router.patch('/cancel-order',orderController.cancelOrder) 
router.patch('/return-order',orderController.returnOrder)
 
router.post('/searchHome',userController.searchHome)
 
 
         
module.exports=router  
