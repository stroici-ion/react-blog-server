import mongoose from 'mongoose';

const MultimediaSchema = new mongoose.Schema(
  {
    isVideo: { type: Boolean, default: false },
    url: { type: String, required: true },
    previewUrl: String,
    caption: String,
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    taggedUsers: [
      {
        location: {
          x: { type: String, required: true },
          y: { type: String, required: true },
        },
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
      },
    ],
    viewsCount: {
      type: Number,
      default: 0,
    },
    pinnedCommentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
    },
    aspectRatio: Number,
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Multimedia', MultimediaSchema);
