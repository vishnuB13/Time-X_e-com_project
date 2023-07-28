const Cart=require('../models/cartSchema')
let userAuth = (req, res, next) => {
        if (req.session.logged) {

            next()

        } else {
            res.redirect('/login')
        }
}

// let guestAuth = (req, res, next) => {
//     try{
//         if (req.session.userLoggedIn) {
//             next();
//         } else {
//             res.redirect('/login')
//         }

//     }catch(e){
//         console.log(e);
//     }
   
// }

let authAdmin = (req, res, next) => {
    try{
        if (req.session.adminLoggedIn) {
            next();
        }
        else {
            res.redirect('/admin');
        }

    }catch(e){
        console.log(e);
    }
   
}
let cartCheck = async (req,res,next)=>{
let cartItems=await Cart.find()
if(!cartItems.length){res.redirect('/')}
else{next()}
}

module.exports = 
   
    {
   
    userAuth,
    
    authAdmin,
    
    cartCheck

    }