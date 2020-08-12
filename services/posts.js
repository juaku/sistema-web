const { mockDocument } = require("../utils/mocks/mock");

class PostsService {
  async getPosts() {
    const expenses = await Promise.resolve(mockDocument);
    return expenses || [];
  }

  async getPost() {
    const expense = await Promise.resolve(mockDocument[0]);
    return expense || [];
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
