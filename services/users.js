const UserModel = require("../utils/schemas/user");
const MongoLib = require("../lib/mongo");

class UsersService {
  constructor() {
    this.model = UserModel;
    this.mongoose = new MongoLib();
  }

  async getUsers() {
    const query = {};
    const users = await this.mongoose.getAll(this.model, query);
    return users || [];
  }

  async getUser({ userId }) {
    const user = await this.mongoose.get(this.model, userId);
    return user || [];
  }

  async createUser({ user }) {
    const createdUserId = await this.mongoose.create(this.model, user);
    return createdUserId;
  }

  async updateUser({ userId, user }) {
    const updatedUserId = await this.mongoose.update(this.model, userId, user);
    return updatedUserId;
  }

  async deleteUser({ userId }) {
    const deletedUserId = await this.mongoose.delete(this.model, userId);
    return deletedUserId;
  }
}

module.exports = UsersService;
