const mongoose = require('mongoose')
const bannerSchema = new mongoose.Schema({       
    imageUrl: {type:String},    
    link: {type:String},        
    altText: {type:String},    
    title: {type:String},      
    description: {type:String},
    startDate: {type:String},    
    endDate: {type:String}  
})

const banner = mongoose.model('Banner',bannerSchema)
module.exports=banner