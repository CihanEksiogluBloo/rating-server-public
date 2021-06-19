const express = require("express");
const mongoose = require("mongoose");
const requireAuth = require("../middlewares/requireAuth");
const Post = mongoose.model("Post");
const User = mongoose.model("User");
const imageUploadFunc = require("../middlewares/imageUpload");
const asyncErrorWrapper = require("express-async-handler");
const path = require("path");

const router = express.Router();

router.use(requireAuth);

router.use(express.json());
router.use(
  express.urlencoded({
    extended: true,
  })
);

router.post(
  "/rating-post",
  asyncErrorWrapper(async (req, res) => {
    try {
      const { star, userID, postID } = req.body;
      const post = await Post.findById(postID);

      if (post) {
        const points = post.points;
        let totalValue = post.totalValue;

        for (const u of points) {
          if (u.userID == userID) {
            //user previously rated this post and user want to change rate point
            totalValue = totalValue - u.star.value + star;
            u.star.value = star;

            await Post.findByIdAndUpdate(
              postID,
              {
                points: points,
                totalValue: totalValue,
                star: totalValue / points.length,
              },
              {
                new: true,
                runValidators: true,
              }
            );

            res.status(200).json({
              message: "Rating Successfull",
              
            });
            return;
          }
        }

        const point = {
          userID,
          star,
        };

        points.push(point);

        const newTotalValue = totalValue + star;
        const rateCount = points.length;

        const updatePost = await Post.findByIdAndUpdate(
          postID,
          {
            points: points,
            totalValue: newTotalValue,
            star: newTotalValue / rateCount,
          },
          {
            new: true,
            runValidators: true,
          }
        );

        const save = updatePost;
        res.status(200).json({
          message: "Rating Successfull",
          data: save,
        });
      }
    } catch (err) {
      res.status(422).send({ error: err.message });
    }
  })
);

router.post(
  "/rating-user",
  asyncErrorWrapper(async (req, res) => {
    try {
      const {userID} = req.body;
      const post = await Post.find({ userID });

      const postCounter = post.length;
      let total = 0;

      for (const u of post) {
        total += u.star.value;
      }
      const socialValue = Number((total / postCounter).toFixed(2));
      await User.findByIdAndUpdate(userID, {
        user_rating: socialValue,
      });
      res.status(200).json({
        message: "Rating Successfull",
        data: socialValue,
      });
    } catch (err) {
      res.status(422).send({ error: err.message });
    }
  })
);

module.exports = router;
