const { default: mongoose } = require('mongoose');
const Address = require('../models/adressSchema')
const User = require('../models/loginschema');
const addressHelpers = require('../helpers/addressHelper')
let userId;

const addAddress = async (req,res)=>{
       try {
        let user = req.session.userId
        addressHelpers.addAddress(user,req.body).then(()=>{
             res.json({status:true})
         }).catch(e=>{
             console.log(e);
             res.status(500).json({ status: false, message: "An error occurred on the server." });
         })
       } catch (error) {
        res.status(500).json({ status: false, message: "An error occurred on the server." });
       }   
}
const putEditAddress = async(req,res)=>{
    try {
        let editedAddress = req.body
        let addressId = req.body.addressId
        addressId =new mongoose.Types.ObjectId(addressId)
       userId = req.session.userId
       await Address.updateOne({user:userId,"address._id":addressId},{$set:{"address.$":editedAddress}})
       res.json({status:true})
       } catch (error) {
        console.log(error)
        res.status(500).json({ status: false, message: "An error occurred on the server." });
       }    
} 

const deleteAddress = async(req,res)=>{
    try{
   
       let addressId = req.body.addressId
       console.log(addressId)
       let userId = req.session.userId
       addressId = new mongoose.Types.ObjectId(addressId)
       await Address.updateOne({"user":userId},{$pull:{address:{"_id":addressId}}})
       res.json({status:true})
       } catch (error) {
       res.status(500).json({ status: false, message: "An error occurred on the server." });
       }
}

const getEditPage = async(req,res)=>{
    try {
    let userId = req.session.userId
    userId =  new mongoose.Types.ObjectId(userId)
   
    let addressId = req.params.id
    addressId = new mongoose.Types.ObjectId(addressId)   
   
    let editAddress= await Address.findOne({user:userId}) 
  
if(editAddress){
    let  editData=editAddress.address.find(item=>item._id.toString()===addressId.toString())

    if (editData) {
        res.render('user/addaddress', { editData, header: true, userdata: true });
    } else {
        res.status(404).render('error', { message: "Address not found." });
    }
    }else {
    res.status(404).render('error', { message: "No User addresses found." });
    }
    } catch (error) {
    console.log(error)
    } 
} 

module.exports = {
                  getEditPage,
                  putEditAddress,
                  addAddress,
                  deleteAddress
                 }