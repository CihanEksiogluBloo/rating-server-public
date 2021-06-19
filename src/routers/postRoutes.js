const express = require("express");
const mongoose = require("mongoose");
const requireAuth = require("../middlewares/requireAuth");
const Post = mongoose.model("Post");
const User = mongoose.model("User");
const imageUploadFunc = require("../middlewares/imageUpload");
const asyncErrorWrapper = require("express-async-handler");
const { ObjectId } = require("mongodb");

const router = express.Router();

router.use(requireAuth);

router.use(express.json());
router.use(
  express.urlencoded({
    extended: true,
  })
);

router.get(
  "/discover",
  asyncErrorWrapper(async (req, res) => {
    const posts = await Post.find({ star: { $gte: 1.2 } })
      .populate({
        path: "user",
        select: "_id profile_image user_rating officialAccount nick_name",
      })
      .select("-totalValue -points -__v -post_comments")
      .sort({ date: -1 })
      .limit(100);
    res.send(posts);
  })
);

router.get(
  "/followed-posts",
  asyncErrorWrapper(async (req, res) => {
    const users = req.user.following;
    users.push(req.user._id);

    const pipeline = [
      {
        $lookup: {
          from: User.collection.name,
          localField: "user",
          foreignField: "_id",
          as: "user",
        },
      },
      { $match: { "user._id": { $in: users } } },
      { $unwind: { path: "$user" } },
      {
        $project: {
          "user.profile_image": 1,
          "user.nick_name": 1,
          "user._id": 1,
          "user.officialAccount": 1,
          explain: 1,
          star: 1,
          image: 1,
          date: 1,
          points: {
            $filter: {
              input: "$points",
              as: "points",
              cond: { $eq: ["$$points.userID", ObjectId(req.user._id)] },
            },
          },
        },
      },
    ];
    const records = await Post.aggregate(pipeline).sort({date:-1});
    
    res.send(records);
  })
);

router.get(
  "/userposts",
  asyncErrorWrapper(async (req, res) => {
    try {
      const posts = await Post.find({ user: req.user._id });
      res.send(posts);
    } catch (error) {
      res.send(error);
      console.log(error);
    }
  })
);

router.post(
  "/posts",
  imageUploadFunc("posts").single("datas"),
  asyncErrorWrapper(async (req, res) => {
    try {
      const { explain, category } = req.body;

      const date = Date.now();

      const post = new Post({
        image: req.savedImages,
        date,
        explain,
        category,
        user: req.user._id,
      });

      const save = await post.save();

      res.status(200).json({
        message: "Image Upload Successfull",
        data: save,
      });
    } catch (err) {
      res.status(422).send({ error: err.message });
    }
  })
);

router.post(
  "/comments",
  asyncErrorWrapper(async (req, res) => {
    const { postID } = req.body;
    const post = await Post.findOne({ _id: postID }).populate({
      path: "post_comments",
      populate: {
        path: "user",
        select: "-_id profile_image nick_name user_rating",
      },
      options: {
        sort: { user_rating: -1 },
      },
    });
    const posts = post.post_comments;
    const data = [
      posts,
      {
        reqNick: req.user.nick_name,
        reqProfileImage: req.user.profile_image,
        reqUserStar: req.user.user_rating,
      },
    ];

    res.status(200).json({
      message: "Comments",
      data,
    });
  })
);

router.post(
  "/comments/:postID",
  asyncErrorWrapper(async (req, res) => {
    const { postID } = req.params;
    const { comment } = req.body;

    const post = await Post.findOne({ _id: postID });
    const postcomments = post.post_comments;

    for (const i of postcomments) {
      if (i.comment == comment && i.nick_name === req.user.nick_name) {
        return res.status(400).json({
          message: "You already sent this comment",
        });
      }
    }

    postcomments.push({ user: req.user, comment });

    await post.save({
      post_comments: postcomments,
    });

    res.status(200).json({
      message: "Commenting Successful!",
    });
  })
);

router.post(
  "/search",
  asyncErrorWrapper(async (req, res) => {
    const { searchKey } = req.body;

    const user = await User.find({
      nick_name: { $regex: searchKey, $options: "i" },
    })
      .limit(10)
      .select("profile_image name user_rating nick_name");

    res.status(200).json({
      message: "Search completed successfully",
      user,
    });
  })
);

router.post(
  "/postDelete",
  asyncErrorWrapper(async (req, res) => {
    const { postID } = req.body;

    await Post.deleteOne({ _id: postID });

    res.status(200).json({
      message: "Post Deleted",
    });
  })
);

module.exports = router;
