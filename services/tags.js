const TagModel = require("../utils/schemas/tag");
const MongoLib = require("../lib/mongo");

class TagsService {
  constructor() {
    this.model = TagModel;
    this.mongoose = new MongoLib();
  }

  async getTags() {
    const query = {};
    const tags = await this.mongoose.getAll(this.model, query);
    return tags || [];
  }

  async getTag({ query }) {
    const tag = await this.mongoose.get(this.model, query);
    return tag || [];
  }

  async createTag({ tag }) {
    const createdTagId = await this.mongoose.create(this.model, tag);
    return createdTagId || null;
  }

  async updateTag({ tagId, tag }) {
    const updatedTagId = await this.mongoose.update(this.model, tagId, tag);
    return updatedTagId;
  }

  async deleteTag({ tagId }) {
    const deletedTagId = await this.mongoose.delete(this.model, tagId);
    return deletedTagId;
  }
}

module.exports = TagsService;
