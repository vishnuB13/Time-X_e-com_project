const mongoose = require('mongoose')

const categorySchema = new mongoose.Schema(
    {
      category:
      {
        type:String,
        required:true
      } ,
      deleted:{
        type:Boolean,
        default:false
      }
    },
    {
        timestamps:true
    }
)
const Category = mongoose.model('category',categorySchema)

module.exports = Category; 