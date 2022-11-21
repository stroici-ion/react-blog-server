import mongoose from 'mongoose';

const PostSchema = new mongoose.Schema(
  {
    title: String,
    text: String,
    emotion: String,
    tags: [{ type: String }],
    audienceType: String,
    taggedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    viewsCount: {
      type: Number,
      default: 0,
    },
    images: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Multimedia',
      },
    ],
    pinnedCommentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Post', PostSchema);
