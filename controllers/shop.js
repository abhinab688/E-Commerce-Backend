const Product = require('../models/product');
const CartItem=require('../models/cart-item')
const Cart = require('../models/cart');
const Order=require('../models/order');
const OrderItem=require('../models/order-item');

const ITEMS_PER_PAGE=2;
const ITEMS_PER_CART=1;
exports.getProducts = (req, res, next) => {
  Product.findAll()
    .then(products => {
      res.json({products, success:true})
      // res.render('shop/product-list', {
      //   prods: products,
      //   pageTitle: 'All Products',
      //   path: '/products'
      // });
    })
    .catch(err => {
      console.log(err);
    });
};

exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  // Product.findAll({ where: { id: prodId } })
  //   .then(products => {
  //     res.render('shop/product-detail', {
  //       product: products[0],
  //       pageTitle: products[0].title,
  //       path: '/products'
  //     });
  //   })
  //   .catch(err => console.log(err));
  Product.findById(prodId)
    .then(product => {
      res.render('shop/product-detail', {
        product: product,
        pageTitle: product.title,
        path: '/products'
      });
    })
    .catch(err => console.log(err));
};

exports.getIndex = (req, res, next) => {
  const page= +req.query.page || 1;
  let totalProds;
  Product.count().then(numProducts=>{
    totalProds=numProducts;
    return Product.findAll({
      offset:(page-1)*ITEMS_PER_PAGE,
      limit:ITEMS_PER_PAGE
    });
  }).then(products => {
      res.json({
        products:products,
        currentPage:page,
        hasNextPage:ITEMS_PER_PAGE * page < totalProds,
        hasPreviousPage:page >1,
        nextPage:page + 1,
        previousPage: page -1,
        lastPage:Math.ceil(totalProds/ITEMS_PER_PAGE)
      });
    })
    .catch(err => {
      console.log(err);
    });
};

exports.getCart = (req, res, next) => {
  req.user
    .getCart()
    .then(cart => {
      return cart
        .getProducts()
        .then(products => {
          res.json({products, success:true})
          // res.render('shop/cart', {
          //   path: '/cart',
          //   pageTitle: 'Your Cart',
          //   products: products
          // });
        })
        .catch(err => console.log(err));
    })
    .catch(err => console.log(err));
};

exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;
  let fetchedCart;
  let newQuantity = 1;
  req.user
    .getCart()
    .then(cart => {
      fetchedCart = cart;
      return cart.getProducts({ where: { id: prodId } });
    })
    .then(products => {
      let product;
      if (products.length > 0) {
        product = products[0];
      }

      if (product) {
        const oldQuantity = product.cartItem.quantity;
        newQuantity = oldQuantity + 1;
        return product;
      }
      return Product.findByPk(prodId);
    })
    .then(product => {
      return fetchedCart.addProduct(product, {
        through: { quantity: newQuantity }
      });
    })
    .then(() => {
      res.status(200).json({success:true, message:'Succesfully added'})
    })
    .catch(err =>{
      res.status(500).json({success:false, message : 'Error occured'})
    });
};

exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  req.user
    .getCart()
    .then(cart => {
      return cart.getProducts({ where: { id: prodId } });
    })
    .then(products => {
      const product = products[0];
      return product.cartItem.destroy();
    })
    .then(result => {
      res.status(200).json({success:true, message:'Deleted'});
    })
  .catch(err => {
    res.status(500).json({success:false, message:"Failed"})
  });
};

exports.postOrder =  async (req,res,next)=>{
  let order = await req.user.createOrder() 
  let myOrders = []
  req.user.getCart()
  .then(cart=>{
      cart.getProducts()
      .then(async(products)=>{
          for(let i=0;i<products.length;i++) {
             let order_items =   await order.addProduct(products[i] , { 
                  through : {quantity : products[i].cartItem.quantity} })
                  myOrders.push(order_items)
                 }
                 CartItem.destroy({where:{cartId : cart.id}})
                 .then(response=>console.log(response))
                 res.status(200).json({data: myOrders ,  message:'Order Succesfully Placed',success : true})
               })
      .catch(err=>console.log(err))
  })
  .catch((err)=>{
       res.status(500).json({err, message:'Error Occured '})
  })
}

exports.getOrder = (req,res,next)=>{
  let Orders=[]
  let userId = req.user.id
  Order.findAll({where:{userId:userId}})
  .then(async(orders)=>{
      for(let i=0;i<orders.length;i++) {
        let productsarr = []
        let orderobj = {'Orders': orders[i]}
       let OrderItems = await OrderItem.findAll({where:{orderId : orders[i].id}})
       for(let j=0;j<OrderItems.length;j++) {
          let product = await Product.findByPk(OrderItems[j].productId)
          productsarr.push(product)
       }
          orderobj["Products"] = productsarr
          Orders.push(orderobj)
      }
      res.status(200).json({data:Orders, success: true})
  })
}

exports.getCheckout = (req, res, next) => {
  res.render('shop/checkout', {
    path: '/checkout',
    pageTitle: 'Checkout'
  });
};


// exports.postOrder = (req,res,next)=>{
//   //get the cart items and place them in order
//   const order=req.user.createOrder();
//   const my_order=[];

//   req.user.getCart()
//   .then(cart =>{
//     cart.getProducts()
//     .then(async(products=>{
//       for(var i=0;i<products.length; i++ ){
//         let order_items=await order.addProduct(products[i], {
//           through:{quantity:products[i].cartItem.quantity}
//         })
//         my_order.push(order_items)
//         console.log(order_items,'orderitemssssss')
//       }
//       CartItem.destroy({where:{cartId:cart.id}})
//       .then(res=>console.log(res))
//       res.status(200).json({data:my_order, success:true})
//     }))
//     .catch(err=> console.log(err))
//   })
//   .catch(err=> console.log(err))
// }