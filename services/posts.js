const PostModel = require("../utils/schemas/post");
const MongoLib = require("../lib/mongo");
const TagsService = require("../services/tags");

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

  async getPost({ query }) {
    const post = await this.mongoose.get(this.model, query);
    return post || [];
  }

  async createPost({ post }) {
    let query = {
      tag: post.tag.name,
    };

    const tagsService = new TagsService();
    let tag = await tagsService.getTag({ query });
    let tagId = tag ? tag._id : null;
    let tagName = post.tag.name;
    if (!tagId) {
      let tag = query;
      tagId = await tagsService.createTag({ tag });
    }

    post.tag = {};
    post.tag.id = tagId;
    post.tag.name = tagName;
    post.user = {};
    post.user.id = "5f6fe8c4488a9ae713a55a9a"; // TODO: Refactor later
    post.user.username = "diegocaminor";
    post.user.hexcode = "f05";
    post.media = "123.png";

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
