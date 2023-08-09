const Address = require('../models/adressSchema');
const Banner = require('../models/bannerSchema')


const addAddress = async (userId,userData)=>{
    let addAddress = {
        firstname:userData.firstname,
        lastname:userData.lastname,
        state:userData.state,
        streetaddress:userData.streetAddress,
        appartment:userData.appartment,
        town:userData.town,
        zip:userData.zip,
        mobile:userData.mobile,
        email:userData.email,
        radio:userData.radio
    }

   try{
   let data = await Address.findOne({user:userId})
    if(data){
        data.address.push(addAddress) 
        const userData = await Address.findOneAndUpdate(
            {user:userId},
            {$set:{address:data.address}},
            { returnDocument: "after" }
            );
          
         }else{
        const newAddress = new Address({
            user:userId,
            address:[addAddress]
        });

        const addressData = await newAddress.save();
      
      
    }
   }catch(e){
    console.log(e);
    res.status(500).render('user/error', { message: "An error occurred while processing your request." });   

   }
}

const editAddress =async (userId,addressId)=>{
    try{
        const userfind = await Address.findOne({user:userId});
        const address = userfind.address.find(index=>index._id == addressId);
        return address;
    }catch(e){
        console.log(e);
        res.status(500).render('user/error', { message: "An error occurred while processing your request." });   

    }
}

const getDeliveryAddress = async (userId,addressId)=>{
    try{
       const addressFind = await Address.findOne({user:userId});
       const address = addressFind.address;
       const deliveryAddress = address.find(item => item._id == addressId)
       return deliveryAddress
      }catch(e){
        console.log(e);
        res.status(500).render('user/error', { message: "An error occurred while processing your request." });   

    }
}

const validBanner = async()=>{
try {
    let banner=await Banner.find()
return banner
} catch (error) {
    res.status(500).render('user/error', { message: "An error occurred while processing your request." });   

}
}



module.exports ={
    addAddress,
    editAddress,
    getDeliveryAddress,
    validBanner
}
