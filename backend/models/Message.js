const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: String, required: true },
  body: { type: String, required: true },
  threadId: { type: String }, // groups replies together
  isRead: { type: Boolean, default: false },
  deletedBySender: { type: Boolean, default: false },
  deletedByRecipient: { type: Boolean, default: false }
}, { timestamps: true });

messageSchema.pre('save', async function() {
  if (!this.threadId) {
    this.threadId = this._id.toString();
  }
});

module.exports = mongoose.model('Message', messageSchema);
