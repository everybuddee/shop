const mongoose = require('mongoose')

const Schema = mongoose.Schema

const productSchema = new Schema ({
  title : {
    type : String,
    required : true
  },
  price : {
    type : Number,
    required : true
  },
  description : {
    type : String,
    required : true
  },
  imageUrl :{
    type : String,
    required : true
  },
  userId:{
    type : Schema.Types.ObjectId,
    ref:'User',
    required : true
  }
})

module.exports = mongoose.model('Product', productSchema)








// class Product {
//   constructor(title, description,imageUrl,price) {
//       this.title = title;
//       this.description = description;
//       this.imageUrl = imageUrl;
//       this.price = price;
//   }
//   save(){
//     const db = getDb();
//      return db.collection('products')
//       .insertOne(this)
//       .then(result =>{
//         console.log(result) 
//       })
//       .catch(error => console.log(error))
//   }
//   static fetchAll(){
//     const db = getDb();
//     return db.collection('products')
//     .find()
//     .toArray()
//     .then(prod => {return prod})
//     .catch(error => console.log(error))
//   }
//   static findById(prodId){
//     const db = getDb();
//     return db.collection('products')
//     .find({_id: new mongodb.ObjectId(prodId)})
//     .next()
//     .then((product) => {
//       return product
//     }

//     )
//     .catch(error => console.log(error))
//   }
// }


// module.exports = Product