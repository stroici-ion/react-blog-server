import { Schema, model } from 'mongoose';

const GroupSchema = new Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    avatarUrl: String,
    imageCoverUrl: String,
    phoneNumber: String,
    deteOfBirth: Date,
    images: [{ type: String }],
  },
  {
    timestamps: true,
  }
);

export default model('Group', GroupSchema);
