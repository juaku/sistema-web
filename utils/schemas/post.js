const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Defining schema of 'Posts' collection
var postSchema = new Schema({
  tag: {
    id: { type: Schema.ObjectId, ref: "Tag", required: true },
    name: { type: String, required: true },
  },
  coordinates: { type: [Number], required: true },
  active: Boolean,
  media: String,
  city: String,
  country: String,
  user: {
    id: { type: Schema.ObjectId, ref: "User", required: true },
    username: { type: String, required: true },
    hexcode: { type: String, required: true },
  },
  createdAt: { type: Date, default: Date.now },
  reportedBy: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  ],
});

let Post = mongoose.model("Posts", postSchema);

module.exports = Post;
