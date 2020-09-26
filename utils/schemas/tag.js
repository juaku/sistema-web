const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Defining schema of 'Tags' collection
let tagSchema = new Schema({
  tag: String,
  createdAt: { type: Date, default: Date.now },
});

let Tag = mongoose.model("Tags", tagSchema);

module.exports = Tag;
