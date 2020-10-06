const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Defining schema of 'Users' collection
let userSchema = new Schema({
  providerId: { type: String, unique: true },
  provider: String,
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  gender: String,
  birthDate: Date,
  savedPosts: [{ type: Schema.Types.ObjectId, ref: "Post" }],
  email: {
    type: String,
    required: "Email address is required",
    match: [
      /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
      "Please fill a valid email address",
    ],
  },
  hexCode: { type: String, required: "Hexcode is required" },
  userName: { type: String, required: "Username is required" },
  password: String,
  isAdmin: Boolean,
  profilePic: String,
  reportedPosts: [{ type: Schema.Types.ObjectId, ref: "Post" }],
  channels: [{ type: Schema.Types.ObjectId, ref: "User" }],
  blockedUsers: [{ type: Schema.Types.ObjectId, ref: "User" }],
  createdAt: { type: Date, default: Date.now },
});

userSchema.index({ hexCode: 1, userName: 1 }); // clave compuesta en mongodb

let User = mongoose.model("Users", userSchema);

module.exports = User;
