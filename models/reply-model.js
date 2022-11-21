import mongoose from 'mongoose';

const ReplySchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    commentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
      required: true,
    },
    replyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Reply',
    },
    isLikedByAuthor: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Reply', ReplySchema);
