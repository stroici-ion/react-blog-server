import fs from 'fs';
import mongoose from 'mongoose';
import path from 'path';

import PostSchema from '../models/post-model.js';
import LikeSchema from '../models/like-model.js';
import MultimediaSchema from '../models/multimedia-model.js';
import CommentSchema from '../models/comment-model.js';
import ReplySchema from '../models/reply-model.js';
import {
  createMultimedia,
  createOneMultimedia,
} from '../service/post-service.js';

export const getAll = async (req, res) => {
  try {
    const { tags, userId, sortBy, currentPage, limit } = req.query;
    const _userId = mongoose.Types.ObjectId(req.userData?.id);

    let conditions = {};
    let sort = {};

    if (!!tags) {
      conditions.tags = { $in: tags };
    }

    if (userId) {
      conditions.userId = mongoose.Types.ObjectId(userId);
    }

    if (sortBy) {
      switch (sortBy) {
        case 'news': {
          sort = { createdAt: -1 };
          break;
        }
        case 'popular': {
          sort = { viewsCount: -1 };
          break;
        }
      }
    }

    const posts = await PostSchema.aggregate([
      { $match: { ...conditions } },
      {
        $facet: {
          count: [{ $count: 'count' }],
          posts: [
            {
              $lookup: {
                from: 'users',
                localField: 'taggedUsers',
                foreignField: '_id',
                pipeline: [
                  {
                    $project: {
                      _id: 1,
                      fullName: 1,
                      avatarUrl: 1,
                    },
                  },
                ],
                as: 'taggedUsersInfo',
              },
            },
            {
              $lookup: {
                from: 'multimedias',
                localField: 'images',
                foreignField: '_id',
                pipeline: [{ $sort: { createdAt: -1 } }],
                as: 'imagesInfo',
              },
            },
            {
              $lookup: {
                from: 'comments',
                localField: '_id',
                foreignField: 'postId',
                as: 'commentsInfo',
              },
            },
            {
              $lookup: {
                from: 'users',
                localField: 'userId',
                foreignField: '_id',
                pipeline: [
                  {
                    $project: {
                      _id: 1,
                      fullName: 1,
                      avatarUrl: 1,
                    },
                  },
                ],
                as: 'userInfo',
              },
            },
            {
              $lookup: {
                from: 'likes',
                localField: '_id',
                foreignField: 'postId',
                pipeline: [{ $match: { like: true } }],
                as: 'likesInfo',
              },
            },
            {
              $lookup: {
                from: 'likes',
                localField: '_id',
                foreignField: 'postId',
                pipeline: [{ $match: { like: false } }],
                as: 'dislikesInfo',
              },
            },
            {
              $project: {
                _id: 1,
                emotion: 1,
                title: 1,
                text: 1,
                tags: 1,
                viewsCount: 1,
                audienceType: 1,
                taggedUsers: '$taggedUsersInfo',
                user: { $first: '$userInfo' },
                commentsCount: { $size: ['$commentsInfo'] },
                images: '$imagesInfo',
                createdAt: 1,
                updatedAt: 1,
                likesCount: { $size: ['$likesInfo'] },
                dislikesCount: { $size: ['$dislikesInfo'] },
                liked: {
                  $in: [_userId, '$likesInfo.userId'],
                },
                disliked: {
                  $in: [_userId, '$dislikesInfo.userId'],
                },
              },
            },
            {
              $sort: sort,
            },
            {
              $skip: (currentPage - 1) * limit,
            },
            {
              $limit: limit * 1,
            },
          ],
        },
      },
    ]);

    res.json({ posts: posts[0]?.posts, count: posts[0]?.count[0]?.count });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: 'Failed to get posts',
    });
  }
};

export const getOne = async (req, res) => {
  try {
    const { id } = req.params;
    const _userId = mongoose.Types.ObjectId(req.userData?.id);

    await PostSchema.findOneAndUpdate(
      {
        _id: id,
      },
      {
        $inc: { viewsCount: 1 },
      }
    );
    const postId = mongoose.Types.ObjectId(id);
    const post = await PostSchema.aggregate([
      {
        $match: { _id: postId },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'taggedUsers',
          foreignField: '_id',
          pipeline: [
            {
              $project: {
                _id: 1,
                fullName: 1,
                avatarUrl: 1,
              },
            },
          ],
          as: 'taggedUsersInfo',
        },
      },
      {
        $lookup: {
          from: 'multimedias',
          localField: 'images',
          foreignField: '_id',
          pipeline: [{ $sort: { createdAt: -1 } }],
          as: 'imagesInfo',
        },
      },
      {
        $lookup: {
          from: 'comments',
          localField: '_id',
          foreignField: 'post',
          as: 'commentsInfo',
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          pipeline: [
            {
              $project: {
                _id: 1,
                fullName: 1,
                avatarUrl: 1,
              },
            },
          ],
          as: 'userInfo',
        },
      },
      {
        $lookup: {
          from: 'likes',
          localField: '_id',
          foreignField: 'postId',
          pipeline: [{ $match: { like: true } }],
          as: 'likesInfo',
        },
      },
      {
        $lookup: {
          from: 'likes',
          localField: '_id',
          foreignField: 'postId',
          pipeline: [{ $match: { like: false } }],
          as: 'dislikesInfo',
        },
      },
      {
        $project: {
          _id: 1,
          emotion: 1,
          title: 1,
          text: 1,
          tags: 1,
          viewsCount: 1,
          audienceType: 1,
          taggedUsers: '$taggedUsersInfo',
          user: { $first: '$userInfo' },
          commentsCount: { $size: ['$commentsInfo'] },
          images: '$imagesInfo',
          createdAt: 1,
          updatedAt: 1,
          likesCount: { $size: ['$likesInfo'] },
          dislikesCount: { $size: ['$dislikesInfo'] },
          liked: {
            $in: [_userId, '$likesInfo.userId'],
          },
          disliked: {
            $in: [_userId, '$dislikesInfo.userId'],
          },
        },
      },
    ]);

    res.json(post[0]);
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: 'Failed to get posts',
    });
  }
};

export const getOneMultimedia = async (req, res) => {
  try {
    const { id } = req.params;
    const _userId = mongoose.Types.ObjectId(req.userData?.id);
    const multimediaCandidate = await MultimediaSchema.findById(id);
    if (multimediaCandidate) {
      multimediaCandidate.viewsCount = multimediaCandidate.viewsCount + 1;
      await multimediaCandidate.save();
      const multimedia = await MultimediaSchema.aggregate([
        { $match: { _id: multimediaCandidate._id } },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            pipeline: [
              {
                $project: {
                  _id: 1,
                  fullName: 1,
                  avatarUrl: 1,
                },
              },
            ],
            as: 'userInfo',
          },
        },
        {
          $lookup: {
            from: 'likes',
            localField: '_id',
            foreignField: 'multimediaId',
            pipeline: [{ $match: { like: true } }],
            as: 'likesInfo',
          },
        },
        {
          $lookup: {
            from: 'likes',
            localField: '_id',
            foreignField: 'multimediaId',
            pipeline: [{ $match: { like: false } }],
            as: 'dislikesInfo',
          },
        },
        {
          $lookup: {
            from: 'comments',
            localField: '_id',
            foreignField: 'multimediaId',
            as: 'commentsInfo',
          },
        },
        {
          $project: {
            _id: 1,
            url: 1,
            previewUrl: 1,
            isVideo: 1,
            taggedUsers: 1,
            aspectRatio: 1,
            viewsCount: 1,
            caption: 1,
            user: { $first: '$userInfo' },
            commentsCount: { $size: ['$commentsInfo'] },
            likesCount: { $size: ['$likesInfo'] },
            dislikesCount: { $size: ['$dislikesInfo'] },
            liked: {
              $in: [_userId, '$likesInfo.userId'],
            },
            disliked: {
              $in: [_userId, '$dislikesInfo.userId'],
            },
          },
        },
      ]);
      res.json(multimedia[0]);
    } else {
      res.status(500).json({
        message: 'Failed to get posts',
      });
    }
  } catch (e) {
    console.log(e);
    res.status(500).json({
      message: 'Failed to get posts',
    });
  }
};

export const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userData?.id;
    const candidate = await PostSchema.findById(id);
    if (candidate) {
      if (candidate.userId.toString() === userId) {
        const multimedias = await MultimediaSchema.find({
          _id: { $in: candidate.images },
        });
        multimedias.forEach((multimedia) => {
          fs.unlinkSync(path.resolve('static/multimedia', multimedia.url));
          if (multimedia.isVideo)
            fs.unlinkSync(
              path.resolve('static/multimedia', multimedia.previewUrl)
            );

          LikeSchema.find({ multimediaId: multimedia._id }).then((likes) =>
            likes.forEach((like) => like.remove())
          );
          CommentSchema.find({ multimediaId: multimedia._id }).then(
            (comments) => {
              comments.forEach((comment) => {
                LikeSchema.find({ commentId: comment._id }).then((likes) =>
                  likes.forEach((like) => like.remove())
                );
                ReplySchema.find({ commentId: comment._id }).then((replies) => {
                  replies.forEach((reply) => {
                    LikeSchema.find({ replyId: reply._id }).then((likes) =>
                      likes.forEach((like) => like.remove())
                    );
                    reply.remove();
                  });
                });
                comment.remove();
              });
            }
          );
          multimedia.remove();
        });
        LikeSchema.find({ postId: candidate._id }).then((likes) =>
          likes.forEach((like) => like.remove())
        );
        CommentSchema.find({ postId: candidate._id }).then((comments) => {
          comments.forEach((comment) => {
            LikeSchema.find({ commentId: comment._id }).then((likes) =>
              likes.forEach((like) => like.remove())
            );
            ReplySchema.find({ commentId: comment._id }).then((replies) => {
              replies.forEach((reply) => {
                LikeSchema.find({ replyId: reply._id }).then((likes) =>
                  likes.forEach((like) => like.remove())
                );
                reply.remove();
              });
            });
            comment.remove();
          });
        });
        await candidate.remove();
        res.json({ success: true });
      } else {
        return res.status(403).json({
          message: 'Access denied',
        });
      }
    } else {
      return res.status(404).json({
        message: 'Post not found',
      });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: 'Failed to get posts',
    });
  }
};

export const create = async (req, res) => {
  try {
    const {
      title,
      audienceType,
      text,
      tags,
      taggedImages,
      imagesInfo,
      taggedPeople,
      emotion,
    } = req.body;
    const userId = req.userData?.id;

    const images = getArrayFrom(req.files?.images);
    const thumbnails = getArrayFrom(req.files?.thumbnails);

    let newImages = [];

    if (images) {
      newImages = await createMultimedia(
        images,
        thumbnails,
        JSON.parse(taggedImages),
        userId,
        JSON.parse(imagesInfo)
      );
    }

    const postFields = {
      emotion: emotion || '',
      taggedUsers: taggedPeople ? taggedPeople.split('#') : [],
      audienceType,
      userId,
      title,
      text,
      tags: tags ? String(tags).split('#') : [],
      images: newImages,
    };

    const post = await PostSchema.create(postFields);
    res.json(post);
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: 'Failed to create post',
    });
  }
};

export const update = async (req, res) => {
  try {
    const {
      title,
      audienceType,
      text,
      tags,
      taggedImages,
      taggedPeople,
      emotion,
    } = req.body;
    const { postId } = req.params;
    const userId = req.userData?.id;

    const taggedUsers = JSON.parse(taggedImages);

    const imagesInfo = req.body?.imagesInfo
      ? JSON.parse(req.body?.imagesInfo)
      : [];
    const images = getArrayFrom(req.files?.images);
    const thumbnails = getArrayFrom(req.files?.thumbnails);

    const candidate = await PostSchema.findById(postId);
    const newImages = [];

    if (candidate) {
      if (candidate.userId.toString() === userId) {
        const currentMultimedia = await MultimediaSchema.find({
          _id: { $in: candidate.images },
        });

        //delete multimedia

        for await (const item of currentMultimedia) {
          if (!imagesInfo.map((obj) => obj.id).includes(item._id.toString())) {
            fs.unlinkSync(path.resolve('static/multimedia', item.url));
            if (item.isVideo)
              fs.unlinkSync(path.resolve('static/multimedia', item.previewUrl));

            LikeSchema.find({ multimediaId: item._id }).then((likes) =>
              likes.forEach((like) => like.remove())
            );
            CommentSchema.find({ multimediaId: item._id }).then((comments) => {
              comments.forEach((comment) => {
                LikeSchema.find({ commentId: comment._id }).then((likes) =>
                  likes.forEach((like) => like.remove())
                );
                ReplySchema.find({ commentId: comment._id }).then((replies) => {
                  replies.forEach((reply) => {
                    LikeSchema.find({ replyId: reply._id }).then((likes) =>
                      likes.forEach((like) => like.remove())
                    );
                    reply.remove();
                  });
                });
                comment.remove();
              });
            });

            item.remove();
          } else {
            newImages.push(item._id);
            const taggedIamgeCandidate = taggedUsers.find(
              (obj) => obj.id === item._id.toString()
            );

            const aspectRatio = imagesInfo.find(
              (obj) => obj.id === item._id.toString()
            ).aspectRatio;

            const caption = imagesInfo.find(
              (obj) => obj.id === item._id.toString()
            ).caption;

            item.aspectRatio = aspectRatio;
            item.caption = caption;

            if (taggedIamgeCandidate) {
              let newTaggedUsers = [];
              taggedIamgeCandidate.taggedPeople.forEach((item) => {
                newTaggedUsers.push({
                  location: {
                    x: item.left + '',
                    y: item.top + '',
                  },
                  userId: item._id,
                });
              });
              item.taggedUsers = newTaggedUsers;
            }

            await item.save();
          }
        }

        //update multimedia

        for await (const imageFile of images) {
          const candidateMultimedia = currentMultimedia.find(
            (obj) => obj._id.toString() === imageFile.name
          );
          if (candidateMultimedia) {
            fs.unlinkSync(
              path.resolve('static/multimedia', candidateMultimedia.url)
            );
            imageFile.mv(
              path.resolve('static/multimedia', candidateMultimedia.url)
            );

            const thumbnailCandidate = thumbnails.find(
              (obj) => obj.name === imageFile.name
            );

            if (thumbnailCandidate) {
              fs.unlinkSync(
                path.resolve(
                  'static/multimedia',
                  candidateMultimedia.previewUrl
                )
              );
              thumbnailCandidate.mv(
                path.resolve(
                  'static/multimedia',
                  candidateMultimedia.previewUrl
                )
              );
            }
          } else {
            const aspectRatio = imagesInfo.find(
              (obj) => obj.id === imageFile.name
            ).aspectRatio;

            const caption = imagesInfo.find(
              (obj) => obj.id === imageFile.name
            ).caption;

            const thumbnailCandidate = thumbnails.find(
              (obj) => obj.name === imageFile.name
            );

            const newMultimdia = await createOneMultimedia(
              imageFile,
              thumbnailCandidate,
              taggedUsers,
              userId,
              aspectRatio,
              caption
            );
            newImages.unshift(newMultimdia);
          }
        }

        for await (const thumbnailFile of thumbnails.filter(
          (thmb) => !images.find((img) => img.name !== thmb.name)
        )) {
          const candidateMultimedia = currentMultimedia.find(
            (obj) => obj._id.toString() === thumbnailFile.name
          );
          if (candidateMultimedia) {
            fs.unlinkSync(
              path.resolve('static/multimedia', candidateMultimedia.previewUrl)
            );
            thumbnailFile.mv(
              path.resolve('static/multimedia', candidateMultimedia.previewUrl)
            );
          }
        }

        const post = await PostSchema.findByIdAndUpdate(postId, {
          emotion: emotion || '',
          taggedUsers: taggedPeople ? taggedPeople.split('#') : [],
          audienceType,
          title,
          text,
          tags: tags ? String(tags).split('#') : [],
          images: newImages,
        });
        res.json(post);
      } else {
        return res.status(403).json({
          message: 'Access denied',
        });
      }
    } else {
      return res.status(404).json({
        message: 'Post not found',
      });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: 'Failed to create post',
    });
  }
};

const getArrayFrom = (obj) => {
  if (obj)
    if (typeof obj.push === 'undefined') {
      return [obj];
    } else {
      return [...obj];
    }
  return [];
};

export const togglePinnedComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { isMultimedia, commentId } = req.body;
    const userId = req.userData?.id;
    const candidate = isMultimedia
      ? await MultimediaSchema.findById(id)
      : await PostSchema.findById(id);

    if (candidate) {
      if (candidate.userId.toString() === userId) {
        const commentCandidate = isMultimedia
          ? await CommentSchema.findOne({
              _id: commentId,
              multimediaId: id,
            })
          : await CommentSchema.findOne({
              _id: commentId,
              postId: id,
            });
        if (commentCandidate) {
          const result = {
            isPinned: true,
          };
          if (
            candidate.pinnedCommentId?.toString() ===
            commentCandidate._id.toString()
          ) {
            candidate.pinnedCommentId = undefined;
            result.isPinned = false;
          } else candidate.pinnedCommentId = commentCandidate._id;

          await candidate.save();

          res.json(result);
        } else {
          res.status(404).json({
            message: 'Comment is not found',
          });
        }
      } else {
        res.status(403).json({
          message: 'Access denied',
        });
      }
    } else {
      res.status(404).json({
        message: 'Post is not found',
      });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: 'Failed to get posts',
    });
  }
};

export const likeMultimedia = async (req, res) => {
  try {
    const { id } = req.params;
    const { like } = req.body;
    const userId = req.userData?.id;

    const _id = mongoose.Types.ObjectId(id);
    const _userId = mongoose.Types.ObjectId(req.userData?.id);
    console.log(id, userId);

    const candidate = await LikeSchema.findOne({
      userId: userId,
      multimediaId: id,
    });

    if (candidate) {
      if (candidate.like === like) {
        await candidate.remove();
      } else {
        candidate.like = like;
        await candidate.save();
      }
    } else {
      await LikeSchema.create({ like, userId, multimediaId: id });
    }
    const currentLikesInfo = await MultimediaSchema.aggregate([
      {
        $match: { _id },
      },
      {
        $lookup: {
          from: 'likes',
          localField: '_id',
          foreignField: 'multimediaId',
          pipeline: [{ $match: { like: true } }],
          as: 'likesInfo',
        },
      },
      {
        $lookup: {
          from: 'likes',
          localField: '_id',
          foreignField: 'multimediaId',
          pipeline: [{ $match: { like: false } }],
          as: 'dislikesInfo',
        },
      },
      {
        $project: {
          likesCount: { $size: ['$likesInfo'] },
          dislikesCount: { $size: ['$dislikesInfo'] },
          liked: {
            $in: [_userId, '$likesInfo.userId'],
          },
          disliked: {
            $in: [_userId, '$dislikesInfo.userId'],
          },
        },
      },
    ]);

    res.json(currentLikesInfo[0]);
  } catch (err) {
    res.status(500).json({
      message: 'Failed to like multimedia',
    });
  }
};

export const likePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { like } = req.body;
    const userId = req.userData?.id;

    const _id = mongoose.Types.ObjectId(id);
    const _userId = mongoose.Types.ObjectId(req.userData?.id);

    const candidate = await LikeSchema.findOne({
      userId: userId,
      postId: id,
    });

    if (candidate) {
      if (candidate.like === like) {
        await candidate.remove();
      } else {
        candidate.like = like;
        await candidate.save();
      }
    } else {
      await LikeSchema.create({ like, userId, postId: id });
    }
    const currentLikesInfo = await PostSchema.aggregate([
      {
        $match: { _id },
      },
      {
        $lookup: {
          from: 'likes',
          localField: '_id',
          foreignField: 'postId',
          pipeline: [{ $match: { like: true } }],
          as: 'likesInfo',
        },
      },
      {
        $lookup: {
          from: 'likes',
          localField: '_id',
          foreignField: 'postId',
          pipeline: [{ $match: { like: false } }],
          as: 'dislikesInfo',
        },
      },
      {
        $project: {
          likesCount: { $size: ['$likesInfo'] },
          dislikesCount: { $size: ['$dislikesInfo'] },
          liked: {
            $in: [_userId, '$likesInfo.userId'],
          },
          disliked: {
            $in: [_userId, '$dislikesInfo.userId'],
          },
        },
      },
    ]);

    res.json(currentLikesInfo[0]);
  } catch (err) {
    res.status(500).json({
      message: 'Failed to like post',
    });
  }
};
