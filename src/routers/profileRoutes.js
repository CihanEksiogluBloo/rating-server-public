const express = require("express");
const mongoose = require("mongoose");
const Post = mongoose.model("Post");
const User = mongoose.model("User");
const asyncErrorWrapper = require("express-async-handler");
const imageUploadFunc = require("../middlewares/imageUpload");
const fs = require("fs");
const path = require("path");

const router = express.Router();
router.use(express.json());
router.use(
  express.urlencoded({
    extended: true,
  })
);

router.get(
  "/arena",
  asyncErrorWrapper(async (req, res) => {
    try {
      const posts = await User.find()
        .sort({ user_rating: -1 })
        .select(
          "profile_image name about user_rating officialAccount nick_name"
        )
        .limit(20);
      res.send(posts);
    } catch (error) {
      res.send(error);
      console.log(error);
    }
  })
);

router.post(
  "/profile/user",
  asyncErrorWrapper(async (req, res) => {
    let user = req.body.userID;
    let myProfile = false;
    if (req.body.userID == "myProfile" || req.body.userID == req.user._id) {
      user = req.user._id;
      myProfile = true;
    }
    try {
      const posts = await Post.find({ user }).select(
        "image star explain date id "
      );

      const userModel = await User.findOne({ _id: user }).select(
        "name about profile_image nick_name _id followers following officialAccount totalValue"
      );

      if ((userModel, posts)) {
        const postCounter = posts.length;

        const NaNProtecter = posts.length === 0 ? 1 : posts.length;

        let total = userModel.totalValue !== null ? userModel.totalValue : 0;
        const multiplier = 0.9;

        for (const u of posts) {
          total += u.star.value;
        }
        const socialValue = Number(((total / NaNProtecter) * multiplier).toFixed(2));

        await User.findOneAndUpdate(
          { _id: user },
          {
            user_rating: socialValue === 0 ? 3 : socialValue,
          }
        );

        const data = {
          user: userModel,
          socialValue: socialValue || 3,
          posts,
          postCounter,
          followers: userModel.followers.length,
          following: userModel.following.length,
          myProfile,
          isFollowing: userModel.followers.includes(req.user._id),
        };

        res.status(200).json({
          data,
        });
      }
    } catch (error) {
      res.send(error);
      console.log(error);
    }
  })
);

router.post(
  "/profileInfoUpdate",
  asyncErrorWrapper(async (req, res) => {
    try {
      const { about, name } = req.body;
      const user = await User.findByIdAndUpdate(
        req.user.id,
        {
          about,
          name,
        },
        {
          new: true,
          runValidators: true,
        }
      );
      res.status(200).json({
        message: "Information Update Successfull",
        data: { name: user.name, about: user.about, nick: user.nick_name },
      });
    } catch (err) {
      res.status(422).send({ error: err.message });
    }
  })
);

router.post(
  "/follow",
  asyncErrorWrapper(async (req, res) => {
    try {
      const { userID } = req.body;
      const user = await User.findById(userID);

      const reqUserFollows = req.user.following;
      const userFollowers = user.followers;

      const includes = userFollowers.includes(req.user.id);

      if (includes) {
        res.status(400).json({
          message: "Follower already includes",
        });
        return;
      }

      userFollowers.push(req.user.id);

      reqUserFollows.push(userID);

      await user.save({
        followers: userFollowers,
      });

      await req.user.save({
        following: reqUserFollows,
      });

      res.status(200).json({
        message: "Following Successfull",
      });
    } catch (err) {
      res.status(422).send({ error: err.message });
    }
  })
);

router.post(
  "/unfollow",
  asyncErrorWrapper(async (req, res) => {
    try {
      const { userID } = req.body;
      const user = await User.findById(userID);
      const reqUser = await User.findById(req.user.id);
      const reqUserFollows = reqUser.following;
      const userFollowers = user.followers;

      const includes = reqUserFollows.includes(userID);

      if (!includes) {
        //who is sending request is not following this profile.
        res.status(400).json({
          message: "User is not following",
        });
        return;
      }
      const reqUserindex = userFollowers.indexOf(req.user.id);
      const userindex = reqUserFollows.indexOf(userID);

      if (reqUserindex > -1 && userindex > -1) {
        userFollowers.splice(reqUserindex, 1);
        reqUserFollows.splice(userindex, 1);
      }

      await user.save({
        followers: userFollowers,
      });

      await reqUser.save({
        following: reqUserFollows,
      });

      res.status(200).json({
        message: "Following Successfull",
        data: user,
      });
    } catch (err) {
      res.status(422).send({ error: err.message });
    }
  })
);

router.post(
  "/profileImageUpdate",
  imageUploadFunc("ProfilePhoto").single("datas"),
  asyncErrorWrapper(async (req, res) => {
    try {
      const user = await User.findByIdAndUpdate(
        req.user.id,
        {
          profile_image: req.savedImages,
        },
        {
          new: true,
          runValidators: true,
        }
      );

      if (req.user.profile_image !== "default.jpg") {
        const dosya = req.user.profile_image;
        const rootDir = path.dirname(require.main.filename);
        const publicDir = path.dirname(rootDir);
        const filePath =
          `${path.join(publicDir, "ProfilePhoto")}\\` + `${dosya}`;
        fs.unlinkSync(filePath);
      }
      res.status(200).json({
        message: "Image Upload Successfull",
        data: { profil_image: user.profile_image, user: user.nick_name },
      });
    } catch (err) {
      res.status(422).send({ error: err.message });
    }
  })
);

module.exports = router;
