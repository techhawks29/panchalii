const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  type: { type: String, enum: ['credit', 'debit'], required: true },
  amount: { type: Number, required: true },
  balance: { type: Number, required: true },
  description: { type: String, default: '' },
  reference: { type: String, default: '' },
  at: { type: Date, default: Date.now },
});

const walletSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    balance: { type: Number, default: 0, min: 0 },
    transactions: [transactionSchema],
  },
  { timestamps: true }
);

walletSchema.index({ user: 1 });

module.exports = mongoose.model('Wallet', walletSchema);
