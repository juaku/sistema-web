const { mockDocument } = require("../utils/mocks/mock");

class PostsService {
  async getPosts() {
    const posts = await Promise.resolve(mockDocument);
    return posts || [];
  }

  async getPost() {
    const post = await Promise.resolve(mockDocument[0]);
    return post || [];
  }

  async createPost() {
    const createdPostId = await Promise.resolve(mockDocument[0]._id);
    return createdPostId || [];
  }

  async updatePost() {
    const updatedPostId = await Promise.resolve(mockDocument[0]._id);
    return updatedPostId || [];
  }

  async deletePost() {
    const deletedPostId = await Promise.resolve(mockDocument[0]._id);
    return deletedPostId || [];
  }
}

module.exports = PostsService;
