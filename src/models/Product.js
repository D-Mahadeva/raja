import mongoose from "mongoose";

const ProductPriceSchema = new mongoose.Schema({
  platform: { type: String, required: true },
  price: { type: Number, required: true },
  available: { type: Boolean, default: true },
  deliveryTime: { type: String, default: "30 mins" }
});

const ProductSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, default: "" },
  category: { type: String, required: true },
  image: { type: String, required: true },
  unit: { type: String, default: "1 item" },
  stock: { type: String },
  quantity: { type: String },
  price: { type: Number }, // Original price from scraper
  source: { type: String, required: true }, // Original source platform
  prices: { type: [ProductPriceSchema], default: [] }
}, {
  timestamps: true
});

// Virtual getter for transforming the document
ProductSchema.virtual('fullProduct').get(function() {
  return {
    id: this.id,
    name: this.name,
    description: this.description || `Details about ${this.name}`,
    category: this.category,
    image: this.image !== 'No Image' ? this.image : '/placeholder.svg',
    unit: this.unit || this.stock || this.quantity || '1 item',
    prices: this.prices.length > 0 ? this.prices : [
      { platform: 'blinkit', price: this.price, available: true, deliveryTime: '10 mins' },
      { platform: 'zepto', price: Math.round(this.price * 0.95), available: true, deliveryTime: '8 mins' },
      { platform: 'swiggy', price: Math.round(this.price * 1.05), available: true, deliveryTime: '15 mins' },
      { platform: 'bigbasket', price: Math.round(this.price * 0.98), available: true, deliveryTime: '30 mins' },
      { platform: 'dunzo', price: Math.round(this.price * 1.02), available: true, deliveryTime: '20 mins' }
    ]
  };
});

// Set toJSON option to include virtuals
ProductSchema.set('toJSON', { virtuals: true });
ProductSchema.set('toObject', { virtuals: true });

const Product = mongoose.model("Product", ProductSchema);

export default Product;