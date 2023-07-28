const Product = require('../models/productSchema')


const searchResult=async (data)=>{
    try{

       let searchData = await Product.find({  brand: { '$regex': '^' + data + '.*', $options: 'i' }})
       return searchData
      }catch(e){
        console.log(e)
}
}

module.exports = {
searchResult
}