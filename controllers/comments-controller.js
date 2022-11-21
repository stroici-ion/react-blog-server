import mongoose from 'mongoose';

import CommentSchema from '../models/comment-model.js';
import PostSchema from '../models/post-model.js';
import ReplySchema from '../models/reply-model.js';
import LikeSchema from '../models/like-model.js';
import MultimediaSchema from '../models/multimedia-model.js';

export const create = async (req, res) => {
  try {
    const { text, postId, multimediaId } = req.body;
    const userId = req.userData?.id;

    const comment = await CommentSchema.create({
      text,
      postId: postId,
      multimediaId: multimediaId,
      userId,
    });

    res.json(comment);
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: 'Failed to create comment',
    });
  }
};

export const edit = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const userId = req.userData?.id;
    const comment = await CommentSchema.findOneAndUpdate(
      { _id: id, userId },
      { text }
    );
    if (comment) {
      res.json(comment);
    } else {
      res.status(404).json({
        message: 'Comment not fount',
      });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: 'Failed to edit comment',
    });
  }
};

export const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const { isMultimedia } = req.query;
    const userId = req.userData?.id;
    const comment = await CommentSchema.findById(id);

    if (comment) {
      const authorId = getAuthorIdFromComment(
        comment._id,
        isMultimedia === 'true'
      );

      if (authorId) {
        if (comment.userId.toString() === userId || authorId === userId) {
          await LikeSchema.deleteMany({ commentId: id });
          const replies = await ReplySchema.find({ commentId: id });
          await LikeSchema.deleteMany({
            replyId: { $in: replies.map((item) => item._id) },
          });
          await ReplySchema.deleteMany({ commentId: id });
          await comment.delete();

          res.json({ success: true });
        }
      } else {
        res.status(403).json({
          message: 'Access denied',
        });
      }
    } else {
      res.status(500).json({
        message: 'Comment not fount',
      });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: 'Failed to remove comment',
    });
  }
};

export const getComments = async (req, res) => {
  try {
    const { id } = req.params;
    const { page, limit, isMultimedia, sortBy } = req.query;
    const user = req.userData?.id;

    const _id = mongoose.Types.ObjectId(id);
    const _userId = mongoose.Types.ObjectId(user);

    const _authorId =
      isMultimedia === 'true'
        ? (await MultimediaSchema.findById(id)).userId
        : (await PostSchema.findById(id)).userId;

    let paginationParams = [];
    if (limit && page) {
      paginationParams = [
        {
          $skip: (page - 1) * limit,
        },
        {
          $limit: limit * 1,
        },
      ];
    }

    let sort = {
      isPinnedByAuthor: -1,
      isOwnComment: -1,
      isLikedByAuthor: -1,
      likesCount: -1,
      isRepliedByAuthor: -1,
      createdAt: -1,
    };

    if (sortBy === 'newest') {
      delete sort.isOwnComment;
      delete sort.isLikedByAuthor;
      delete sort.likesCount;
      delete sort.isRepliedByAuthor;
    }

    const match =
      isMultimedia === 'true' ? { multimediaId: _id } : { postId: _id };

    const comments = await CommentSchema.aggregate([
      { $match: match },
      {
        $facet: {
          count: [{ $count: 'count' }],
          comments: [
            {
              $lookup: {
                from: isMultimedia === 'true' ? 'multimedias' : 'posts',
                localField: isMultimedia === 'true' ? 'multimediaId' : 'postId',
                foreignField: '_id',
                as: 'isPinnedInfo',
              },
            },
            {
              $addFields: {
                isPinnedByAuthor: {
                  $cond: {
                    if: {
                      $eq: [
                        '$_id',
                        { $first: '$isPinnedInfo.pinnedCommentId' },
                      ],
                    },
                    then: true,
                    else: false,
                  },
                },
              },
            },
            {
              $lookup: {
                from: 'replies',
                localField: '_id',
                foreignField: 'commentId',
                as: 'repliesInfo',
              },
            },
            {
              $lookup: {
                from: 'likes',
                localField: '_id',
                foreignField: 'commentId',
                pipeline: [{ $match: { like: true } }],
                as: 'likesInfo',
              },
            },
            {
              $lookup: {
                from: 'likes',
                localField: '_id',
                foreignField: 'commentId',
                pipeline: [{ $match: { like: false } }],
                as: 'dislikesInfo',
              },
            },
            {
              $lookup: {
                from: 'users',
                localField: 'userId',
                foreignField: '_id',
                as: 'userInfo',
              },
            },
            {
              $addFields: {
                isOwnComment: {
                  $cond: {
                    if: {
                      $eq: [{ $first: '$userInfo._id' }, _userId],
                    },
                    then: 1,
                    else: -1,
                  },
                },
                likesCount: { $size: ['$likesInfo'] },
              },
            },
            {
              $sort: sort,
            },
            {
              $project: {
                _id: 1,
                text: 1,
                createdAt: 1,
                updatedAt: 1,
                isLikedByAuthor: 1,
                isPinnedByAuthor: 1,
                isRepliedByAuthor: { $in: [_authorId, '$repliesInfo.userId'] },
                repliesCount: { $size: ['$repliesInfo'] },
                likesCount: 1,
                dislikesCount: { $size: ['$dislikesInfo'] },
                liked: {
                  $in: [_userId, '$likesInfo.userId'],
                },
                disliked: {
                  $in: [_userId, '$dislikesInfo.userId'],
                },
                user: {
                  _id: { $first: '$userInfo._id' },
                  fullName: { $first: '$userInfo.fullName' },
                  avatarUrl: { $first: '$userInfo.avatarUrl' },
                },
              },
            },
            ...paginationParams,
          ],
        },
      },
    ]);
    res.json({
      comments: comments[0].comments,
      count: comments[0].count[0].count,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: 'Failed to get comments',
    });
  }
};

export const createReply = async (req, res) => {
  try {
    const { text, commentId, replyId } = req.body;
    const userId = req.userData?.id;
    const reply = await ReplySchema.create({
      text,
      userId,
      commentId,
      replyId,
    });

    res.json(reply);
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: 'Failed to get comments',
    });
  }
};

export const editReply = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const userId = req.userData?.id;
    const reply = await ReplySchema.findOneAndUpdate(
      { _id: id, userId },
      { text }
    );
    if (reply) {
      res.json(reply);
    } else {
      res.status(404).json({
        message: 'Reply not fount',
      });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: 'Failed to edit reply',
    });
  }
};

export const removeReply = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userData?.id;

    const reply = await ReplySchema.findById(id);

    if (reply) {
      const authorId = await getAuthorIdFromReply(reply._id);

      if (authorId) {
        if (authorId === userId || reply.userId.toString() === userId) {
          await LikeSchema.deleteMany({ replyId: id });
          await reply.delete();
          res.json({ success: true });
        } else {
          res.status(403).json({
            message: 'Access denied',
          });
        }
      } else {
        res.status(500).json({
          message: 'Reply not fount',
        });
      }
    } else {
      res.status(500).json({
        message: 'Reply not fount',
      });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: 'Failed to remove reply',
    });
  }
};

export const getReplies = async (req, res) => {
  try {
    const { page, limit } = req.query;
    const _id = mongoose.Types.ObjectId(req.params);
    const _userId = mongoose.Types.ObjectId(req.userData?.id);

    let paginationParams = [];
    if (limit && page) {
      paginationParams = [
        {
          $skip: (page - 1) * limit,
        },
        {
          $limit: limit * 1,
        },
      ];
    }

    const replies = await ReplySchema.aggregate([
      { $match: { commentId: _id } },
      {
        $lookup: {
          from: 'replies',
          localField: 'replyId',
          foreignField: '_id',
          as: 'refReplyInfo',
        },
      },
      {
        $lookup: {
          from: 'likes',
          localField: '_id',
          foreignField: 'replyId',
          pipeline: [{ $match: { like: true } }],
          as: 'likesInfo',
        },
      },
      {
        $lookup: {
          from: 'likes',
          localField: '_id',
          foreignField: 'replyId',
          pipeline: [{ $match: { like: false } }],
          as: 'dislikesInfo',
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'userInfo',
        },
      },
      {
        $addFields: {
          refUserId: { $first: '$refReplyInfo.userId' },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'refUserId',
          foreignField: '_id',
          as: 'refUserInfo',
        },
      },
      {
        $addFields: {
          isOwnReply: {
            $cond: {
              if: {
                $eq: [{ $first: '$userInfo._id' }, _userId],
              },
              then: 1,
              else: -1,
            },
          },
          likesCount: { $size: ['$likesInfo'] },
        },
      },
      {
        $project: {
          _id: 1,
          text: 1,
          createdAt: 1,
          updatedAt: 1,
          isLikedByAuthor: 1,
          likesCount: 1,
          dislikesCount: { $size: ['$dislikesInfo'] },
          // isRepliedByAuthor: { $in: [_authorId, '$repliesInfo.userId'] },
          // answersCount: { $size: ['$repliesInfo'] },
          liked: {
            $in: [_userId, '$likesInfo.userId'],
          },
          disliked: {
            $in: [_userId, '$dislikesInfo.userId'],
          },
          user: {
            _id: { $first: '$userInfo._id' },
            fullName: { $first: '$userInfo.fullName' },
            avatarUrl: { $first: '$userInfo.avatarUrl' },
          },
          refUser: {
            _id: { $first: '$refUserInfo._id' },
            fullName: { $first: '$refUserInfo.fullName' },
            avatarUrl: { $first: '$refUserInfo.avatarUrl' },
          },
        },
      },
      ...paginationParams,
    ]);
    res.json(replies);
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: 'Failed to get comments',
    });
  }
};

export const likeComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { like } = req.body;
    const userId = req.userData?.id;

    const _id = mongoose.Types.ObjectId(id);
    const _userId = mongoose.Types.ObjectId(req.userData?.id);

    const candidate = await LikeSchema.findOne({
      userId: userId,
      commentId: id,
    });

    if (candidate) {
      if (candidate.like === like) {
        await candidate.remove();
      } else {
        candidate.like = like;
        await candidate.save();
      }
    } else {
      await LikeSchema.create({ like, userId, commentId: id });
    }

    const currentLikesInfo = await CommentSchema.aggregate([
      {
        $match: { _id },
      },
      {
        $lookup: {
          from: 'likes',
          localField: '_id',
          foreignField: 'commentId',
          pipeline: [{ $match: { like: true } }],
          as: 'likesInfo',
        },
      },
      {
        $lookup: {
          from: 'likes',
          localField: '_id',
          foreignField: 'commentId',
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
      message: 'Failed to like comment',
    });
  }
};

export const likeReply = async (req, res) => {
  try {
    const { id } = req.params;
    const { like } = req.body;
    const userId = req.userData?.id;

    const _id = mongoose.Types.ObjectId(id);
    const _userId = mongoose.Types.ObjectId(req.userData?.id);

    const candidate = await LikeSchema.findOne({
      userId: userId,
      replyId: id,
    });

    if (candidate) {
      if (candidate.like === like) {
        await candidate.remove();
      } else {
        candidate.like = like;
        await candidate.save();
      }
    } else {
      await LikeSchema.create({ like, userId, replyId: id });
    }

    const currentLikesInfo = await ReplySchema.aggregate([
      {
        $match: { _id },
      },
      {
        $lookup: {
          from: 'likes',
          localField: '_id',
          foreignField: 'replyId',
          pipeline: [{ $match: { like: true } }],
          as: 'likesInfo',
        },
      },
      {
        $lookup: {
          from: 'likes',
          localField: '_id',
          foreignField: 'replyId',
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
      message: 'Failed to like comment',
    });
  }
};

export const likeCommentByAuthor = async (req, res) => {
  try {
    const { id } = req.params;
    const { isMultimedia } = req.body;
    const userId = req.userData?.id;

    const _id = mongoose.Types.ObjectId(id);
    const authorId = await getAuthorIdFromComment(_id, isMultimedia);

    if (authorId === userId) {
      const candidate = await CommentSchema.findOne({
        _id: id,
      });

      if (candidate) {
        candidate.isLikedByAuthor = !candidate.isLikedByAuthor;
        await candidate.save();
        res.json(candidate.isLikedByAuthor);
      } else {
        res.status(404).json({
          message: 'Comment not found',
        });
      }
    } else {
      res.status(403).json({
        message: 'Access denied',
      });
    }
  } catch (err) {
    res.status(500).json({
      message: 'Failed to like comment',
    });
  }
};

export const likeReplyByAuthor = async (req, res) => {
  try {
    const { id } = req.params;
    const { isMultimedia } = req.body;
    const userId = req.userData?.id;

    const _id = mongoose.Types.ObjectId(id);
    const authorId = await getAuthorIdFromReply(_id, isMultimedia);

    if (authorId === userId) {
      const candidate = await ReplySchema.findOne({
        _id: id,
      });

      if (candidate) {
        candidate.isLikedByAuthor = !candidate.isLikedByAuthor;
        await candidate.save();
        res.json(candidate.isLikedByAuthor);
      } else {
        res.status(404).json({
          message: 'Reply not found',
        });
      }
    } else {
      res.status(403).json({
        message: 'Access denied',
      });
    }
  } catch (err) {
    res.status(500).json({
      message: 'Failed to like reply',
    });
  }
};

const getAuthorIdFromReply = async (_id, isMultimedia = false) => {
  const authorId = (
    await ReplySchema.aggregate([
      {
        $match: {
          _id,
        },
      },
      {
        $lookup: {
          from: 'comments',
          localField: 'commentId',
          foreignField: '_id',
          as: 'commentInfo',
        },
      },
      {
        $addFields: {
          postId: {
            $first: isMultimedia
              ? '$commentInfo.multimediaId'
              : '$commentInfo.postId',
          },
        },
      },
      {
        $lookup: {
          from: isMultimedia ? 'multimedias' : 'posts',
          localField: 'postId',
          foreignField: '_id',
          as: 'authorInfo',
        },
      },
      {
        $project: {
          authorId: { $first: '$authorInfo.userId' },
        },
      },
    ])
  )[0]?.authorId?.toString();

  return authorId;
};

const getAuthorIdFromComment = async (_id, isMultimedia = false) => {
  const authorId = (
    await CommentSchema.aggregate([
      {
        $match: {
          _id,
        },
      },
      {
        $lookup: {
          from: isMultimedia ? 'multimedias' : 'posts',
          localField: isMultimedia ? 'multimediaId' : 'postId',
          foreignField: '_id',
          as: 'authorInfo',
        },
      },
      {
        $project: {
          authorId: { $first: '$authorInfo.userId' },
        },
      },
    ])
  )[0]?.authorId?.toString();
  return authorId;
};
