const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Defining schema of 'Posts' collection
var postSchema = new Schema({
  tag: {
    tagId: { type: Schema.ObjectId, ref: "Tmptag" },
    name: { type: String },
    required: true,
  },
  coordinates: { type: [Number], required: true },
  active: Boolean,
  media: String,
  city: String,
  country: String,
  user: { type: Schema.ObjectId, ref: "Tmpuser" },
  createdAt: { type: Date, default: Date.now },
  reportedBy: [
    {
      type: Schema.Types.ObjectId,
      ref: "Tmpuser",
    },
  ],
});

let Post = mongoose.model("Posts", postSchema);

module.exports = Post;
