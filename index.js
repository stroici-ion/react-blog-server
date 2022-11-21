import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import fileUpload from 'express-fileupload';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';

import router from './router/index.js';
import errorMiddleware from './middlewares/error-middleware.js';

const PORT = process.env.PORT || 5000;
const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    credentials: true,
    origin: process.env.CLIENT_URL,
  })
);
app.use('/multimedia', express.static('static/multimedia'));
app.use('/uploads', express.static('uploads'));
app.use('/avatars', express.static('static/avatars'));
app.use('/cover-images', express.static('static/cover-images'));
app.use(fileUpload({}));
app.use('/api', router);
app.use(errorMiddleware);

const start = async () => {
  try {
    mongoose.connect(process.env.DB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
  } catch (e) {
    console.log(e);
  }
};

start();
