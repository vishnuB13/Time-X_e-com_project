const Product = require('../models/productSchema')


const searchResult = async (data) => {
  try {
    const searchData = await Product.find({
      $or: [
        { brand: { $regex: '^' + data + '.*', $options: 'i' } },
        { strapColour: { $regex: '^' + data + '.*', $options: 'i' } },
        { productName: { $regex: '^' + data + '.*', $options: 'i' } },
        { offPrice: parseFloat(data) }, // Assuming offprice is stored as a numeric field
      ],
    });
    return searchData;
  } catch (e) {
    console.log(e);
    res.status(500).render('user/error', { message: "An error occurred while processing your request." });   

  }
};

module.exports = {
searchResult
}