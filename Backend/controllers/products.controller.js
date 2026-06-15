const Product = require('../models/Product');
const { cloudinary } = require('../middleware/upload');

const getAllProducts = async (req, res) => {
  try {
    const { category, sellerId, search } = req.query;
    const filter = {
      isAvailable: true,
      availableQty: { $gt: 0 }
    };
    if (category && category !== 'all') {
      filter.category = category
    };
    if (sellerId) {
      filter.seller = sellerId
    };
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    const products = await Product.find(filter)
      .populate('seller', 'name restaurantName block')
      .sort({ rating: -1 });

    return res
      .status(200)
      .json(products);
  } catch (err) {
    return res
      .status(500)
      .json({ message: err.message });
  }
}

const getSellersProducts = async (req, res) => {
  try {
    const products = await Product.find({
      seller: req.user._id
    })
      .sort({ createdAt: -1 });

    return res
      .status(200)
      .json(products);
  } catch (err) {
    return res
      .status(500)
      .json({ message: err.message });
  }
}

const addNewProduct = async (req, res) => {
  try {
    if (!req.user.subscription.isActive) {
      return res
        .status(403)
        .json({ message: 'Active subscription required to add products' });
    }

    const { name, description, price, category, availableQty, prepTime } = req.body;

    const product = await Product.create({
      seller: req.user._id,
      name, description,
      price: Number(price),
      category: category || 'Canteen',
      availableQty: Number(availableQty),
      prepTime: Number(prepTime) || 15,
      image: req.file ? req.file.path : '',
      imagePublicId: req.file ? req.file.filename : ''
    });

    await product.populate('seller', 'name restaurantName');

    return res
      .status(201)
      .json({
        message: "product added successfully",
        product
      });
  } catch (err) {
    return res
      .status(500)
      .json({ message: err.message });
  }
}

const updateProduct = async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, seller: req.user._id });

    if (!product) {
      return res
        .status(404)
        .json({ message: 'Product not found' });
    }

    const fields = ['name', 'description', 'price', 'category', 'availableQty', 'prepTime', 'isAvailable'];

    fields.forEach(f => {
      if (req.body[f] !== undefined) {
        product[f] = req.body[f];
      }
    });

    if (req.file) {
      if (product.imagePublicId) {
        await cloudinary.uploader.destroy(product.imagePublicId);
      }
      product.image = req.file.path;
      product.imagePublicId = req.file.filename;
    }

    await product.save();

    return res
      .status(200)
      .json(product);
  } catch (err) {
    return res
      .status(500)
      .json({ message: err.message });
  }
}

const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({
      _id: req.params.id,
      seller: req.user._id
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.imagePublicId) {
      await cloudinary.uploader.destroy(product.imagePublicId);
    }

    return res
      .status(200)
      .json({ message: 'Product deleted' });
  } catch (err) {
    return res
      .status(500)
      .json({ message: err.message });
  }
}

module.exports = {
  getAllProducts,
  getSellersProducts,
  addNewProduct,
  updateProduct,
  deleteProduct
}