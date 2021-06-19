const mongoose = require('mongoose');
require('mongoose-double')(mongoose);

const SchemaTypes = mongoose.Schema.Types;

const pointsSchema = mongoose.Schema(
    {
      star: { type:SchemaTypes.Double,default:3.0},
      userID: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
      },
    }
  );

  const commentSchema = mongoose.Schema(
    {
      comment: { type:String,required:true},
      user: {
        type: mongoose.Schema.Types.ObjectId,
        required:true,
        ref: 'User',
      },
    }
  );

const PostSchema = new mongoose.Schema({
    image: {
        type: String,
        default: 'default.jpg'
    },
    star: {
        type:SchemaTypes.Double,
        default:3.0
    },
    totalValue:{
        type:Number,
        default:0
    },
    points : [pointsSchema],
    explain:{
        type:String,
        default:""
    },
    date:{
        type:Date,
    },
    category:{
        type:String,
        default:""
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required:true,
      ref: 'User',
    },


    post_comments:[commentSchema]
    
});

mongoose.model('Post',PostSchema);