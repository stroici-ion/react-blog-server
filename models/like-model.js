import mongoose from 'mongoose';

const LikeSchema = new mongoose.Schema({
  like: { type: Boolean, required: true, default: true },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  commentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
  },
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
  },
  multimediaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Multimedia',
  },
  replyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reply',
  },
});

export default mongoose.model('Like', LikeSchema);
