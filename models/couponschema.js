const mongoose = require('mongoose')

const CouponSchema = mongoose.Schema({
    couponCode :{
        type: String,
        required: true
      },
      discount :{
        type: Number,
        required: true
      },
      minPurchase:{
        type: Number,
        required: true
      },
      maxPurchase:{
        type:Number,
        required:true
      },
      expires:{
        type: Date,
        required: true
      },
      statusEnable:{
        type: Boolean,
        required: true
      }
},
{
    timestamps:true
})

const coupon = mongoose.model('Coupon',CouponSchema)
module.exports = coupon;