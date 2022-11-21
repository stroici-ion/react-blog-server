import PostSchema from '../models/post-model.js';

export const getPopular = async (req, res) => {
  try {
    const popularTags = await PostSchema.aggregate([
      { $unwind: '$tags' },
      {
        $group: {
          _id: '$tags',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);
    res.json(popularTags);
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: 'Failed to get tags',
    });
  }
};
