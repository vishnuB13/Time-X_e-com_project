const express = require('express')
const router = express.Router();
const Swal = require('sweetalert2')

const adminController = require('../controller/admincontroller')
const middleware = require('../middlewares/authentication')
  

router.get('/',adminController.getAdmin)
router.post('/',adminController.adminLogin)
router.get('/logout',middleware.authAdmin, adminController.logOut)

router.get('/adminhome',middleware.authAdmin, adminController.getAdminHome)


router.get('/salesreport',adminController.salesReport)


router.get('/userdetails',middleware.authAdmin, adminController.userdetails)
router.get('/block/:id',middleware.authAdmin, adminController.userBlock)
router.get('/unblock/:id',middleware.authAdmin, adminController.userUnblock)

router.get('/addProduct',middleware.authAdmin, adminController.addProduct)
router.post('/addProduct',adminController.postAddProduct)
router.get('/editproducts/:id',middleware.authAdmin,adminController.getEditProduct)
router.post('/editproducts/:id',adminController.putEditProduct)
router.post('/delete/:id',adminController.deleteProduct)
router.post('/list/:id',adminController.listProduct)
 

router.get('/category',adminController.addCategory) 
router.post('/category',adminController.postCategory)
router.get('/editCategory/:id',adminController.editCategory)
router.put('/editCategory',adminController.putEditCategory)
router.put('/delete-Category',adminController.deleteCategory)
router.put('/list-Category',adminController.listCategory)
router.get('/order-Management',adminController.orderManagement)
router.get('/order-details/:id',adminController.getOrderDetails) 
router.patch('/change-status',adminController.changeStatus)



router.get('/productInfo',middleware.authAdmin, adminController.productInfo)
router.get('/coupon-Management',adminController.couponPage)
router.post('/add_coupon',adminController.postCoupon)
router.patch('/change-coupon-status',adminController.changeStatusCoupon)
router.put('/coupon-details/:id',adminController.getCouponEditModal)
router.patch('/edit-coupon',adminController.editCoupon)


  
 


router.get('/banner', adminController.bannerPage);
router.post('/add-banner',adminController.postBanner)
router.get('/view-banner',adminController.viewBanners)
router.delete('/delete-banner',adminController.deleteBanner)
router.get('/banner-modal',adminController.bannerModal)
router.put('/edit-modal-banner',adminController.editBanner)
 
 


module.exports=router



