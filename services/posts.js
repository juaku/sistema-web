const PostModel = require("../utils/schemas/post");
const MongoLib = require("../lib/mongo");

class PostsService {
  constructor() {
    this.model = PostModel;
    this.mongoose = new MongoLib();
  }

  async getPosts() {
    const query = {};
    const posts = await this.mongoose.getAll(this.model, query);
    return posts || [];
  }

  async getPost({ postId }) {
    const post = await this.mongoose.get(this.model, postId);
    return post || [];
  }

  async createPost({ post }) {
    const createdPostId = await this.mongoose.create(this.model, post);
    return createdPostId;
  }

  async updatePost({ postId, post }) {
    const updatedPostId = await this.mongoose.update(this.model, postId, post);
    return updatedPostId;
  }

  async deletePost({ postId }) {
    const deletedPostId = await this.mongoose.delete(this.model, postId);
    return deletedPostId;
  }
}

module.exports = PostsService;
