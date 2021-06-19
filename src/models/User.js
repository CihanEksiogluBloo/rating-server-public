const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

require("mongoose-double")(mongoose);
const SchemaTypes = mongoose.Schema.Types;

const pointsSchema = mongoose.Schema({
  star: { type: SchemaTypes.Double, default: 3.0 },
  postID: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Post",
  },
});

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  profile_image: {
    type: String,
    default: "default.jpg",
  },
  blocked: {
    type: Boolean,
    default: false,
  },
  followers: [
    {
      type: mongoose.Schema.Types.ObjectId,
    },
  ],
  following: [
    {
      type: mongoose.Schema.Types.ObjectId,
    },
  ],
  name: {
    type: String,
    default: "Backend_Default",
  },
  about: {
    type: String,
    default: "",
  },
  user_rating: {
    type: SchemaTypes.Double,
    default: 3.0,
  },
  nick_name: {
    type: String,
    unique: true,
    required: true,
  },
  points: [pointsSchema],
  totalValue: {
    type: Number,
    default: 0,
  },
  officialAccount:{
    type: Number,
    default: 0,
  }
});

userSchema.pre("save", function (next) {
  const user = this;
  if (!user.isModified("password")) {
    return next();
  }
  bcrypt.genSalt(10, (err, salt) => {
    if (err) {
      return next(err);
    }

    bcrypt.hash(user.password, salt, (err, hash) => {
      if (err) {
        return next(err);
      }
      user.password = hash;
      next();
    });
  });
});

userSchema.methods.comparePassword = function (candidatePassword) {
  const user = this;

  return new Promise((resolve, reject) => {
    bcrypt.compare(candidatePassword, user.password, (err, isMatch) => {
      if (err) {
        return reject(err);
      }
      if (!isMatch) {
        return reject(false);
      }
      resolve(true);
    });
  });
};

mongoose.model("User", userSchema);
