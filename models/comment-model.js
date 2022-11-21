import mongoose from 'mongoose';

const CommentSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
    },
    multimediaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Multimedia',
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

export default mongoose.model('Comment', CommentSchema);
