import { v4 } from 'uuid';
import path from 'path';

import isVideoFile from '../utils/isVideoFile.js';
import MultimediaSchema from '../models/multimedia-model.js';
import getExtension from '../utils/getFileExtension.js';

export const createMultimedia = async (
  multimedia,
  previews,
  taggedUsers,
  userId,
  imagesInfo
) => {
  try {
    let multimediaIdList = [];
    let i = 0;
    for await (const file of multimedia) {
      const extension = getExtension(file.name);
      let fileName = v4() + `.${extension}`;
      await file.mv(path.resolve('static/multimedia', fileName));

      let previewFileName = '';
      let isVideo = false;

      if (isVideoFile(extension)) {
        isVideo = true;
        const previewFile = previews[i];
        i++;
        if (previewFile) {
          previewFileName = 'preview' + fileName + '.jpg';
          await previewFile.mv(
            path.resolve('static/multimedia', previewFileName)
          );
        }
      }

      let newTaggedUsers = [];
      const taggedIamgeCandidate = taggedUsers.find(
        (item) => item.id === file.name
      );

      if (taggedIamgeCandidate) {
        taggedIamgeCandidate.taggedPeople.forEach((item) => {
          newTaggedUsers.push({
            location: {
              x: item.left + '',
              y: item.top + '',
            },
            userId: item._id,
          });
        });
      }

      const aspectRatio =
        imagesInfo.find((item) => item.id === file.name).aspectRatio || 0;

      const caption =
        imagesInfo.find((item) => item.id === file.name).caption || '';

      const newMultimedia = await MultimediaSchema.create({
        url: fileName,
        userId,
        previewUrl: previewFileName,
        isVideo,
        aspectRatio,
        taggedUsers: newTaggedUsers,
        caption,
      });

      multimediaIdList.push(newMultimedia._id);
    }

    return multimediaIdList;
  } catch (e) {
    throw e;
  }
};

export const createOneMultimedia = async (
  image,
  thumbnail,
  taggedUsers,
  userId,
  aspectRatio,
  caption
) => {
  try {
    const extension = getExtension(image.name);
    let fileName = v4() + `.${extension}`;
    await image.mv(path.resolve('static/multimedia', fileName));

    const isVideo = isVideoFile(extension);
    let thumbnailFileName = '';
    if (isVideo) {
      if (thumbnail) {
        thumbnailFileName = 'preview' + fileName + '.jpg';
        await thumbnail.mv(
          path.resolve('static/multimedia', thumbnailFileName)
        );
      }
    }

    let newTaggedUsers = [];
    const taggedIamgeCandidate = taggedUsers.find(
      (item) => item.id === image.name
    );
    if (taggedIamgeCandidate) {
      taggedIamgeCandidate.taggedPeople.forEach((item) => {
        newTaggedUsers.push({
          location: {
            x: item.left + '',
            y: item.top + '',
          },
          userId: item._id,
        });
      });
    }

    const newMultimedia = await MultimediaSchema.create({
      url: fileName,
      userId,
      previewUrl: thumbnailFileName,
      isVideo,
      aspectRatio,
      caption,
      taggedUsers: newTaggedUsers,
    });

    return newMultimedia._id;
  } catch (e) {
    throw e;
  }
};
