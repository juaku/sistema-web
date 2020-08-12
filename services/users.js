const { mockDocument } = require("../utils/mocks/mock");

class UsersService {
  async getUsers() {
    const users = await Promise.resolve(mockDocument);
    return users || [];
  }

  async getUser() {
    const user = await Promise.resolve(mockDocument[0]);
    return user || [];
  }

  async createUser() {
    const createdUserId = await Promise.resolve(mockDocument[0]._id);
    return createdUserId || [];
  }

  async updateUser() {
    const updatedUserId = await Promise.resolve(mockDocument[0]._id);
    return updatedUserId || [];
  }

  async deleteUser() {
    const deletedUserId = await Promise.resolve(mockDocument[0]._id);
    return deletedUserId || [];
  }
}

module.exports = UsersService;
