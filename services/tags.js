const { mockDocument } = require("../utils/mocks/mock");

class TagsService {
  async getTags() {
    const tags = await Promise.resolve(mockDocument);
    return tags || [];
  }

  async getTag() {
    const tag = await Promise.resolve(mockDocument[0]);
    return tag || [];
  }

  async createTag() {
    const createdTagId = await Promise.resolve(mockDocument[0]._id);
    return createdTagId || [];
  }

  async updateTag() {
    const updatedTagId = await Promise.resolve(mockDocument[0]._id);
    return updatedTagId || [];
  }

  async deleteTag() {
    const deletedTagId = await Promise.resolve(mockDocument[0]._id);
    return deletedTagId || [];
  }
}

module.exports = TagsService;
