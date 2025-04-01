import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String, required: true },
  stock: { type: String, required: true },
  category: { type: String, required: true },  // Added category
  source: { type: String, required: true },
});

const Product = mongoose.model("Product", ProductSchema);

export default Product;
