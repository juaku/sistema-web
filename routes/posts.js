const express = require("express");
var ObjectId = require("mongoose").Types.ObjectId;
const PostsService = require("../services/posts");

function postsApi(app) {
  const router = express.Router();
  app.use("/api/posts", router);

  const postsService = new PostsService();

  router.get("/", async function (req, res, next) {
    try {
      const posts = await postsService.getPosts();
      res.status(200).json({
        data: posts,
        message: "posts listed",
      });
    } catch (err) {
      next(err);
    }
  });

  router.get("/:postId", async function (req, res, next) {
    try {
      const { postId } = req.params;
      if (!ObjectId.isValid(postId)) throw new Error("Invalid id");
      const query = { _id: postId };
      const post = await postsService.getPost({ query });
      res.status(200).json({
        data: post,
        message: "post retrieved",
      });
    } catch (err) {
      next(err);
    }
  });

  router.post("/", async function (req, res, next) {
    try {
      const { body: post } = req;
      const createdPostId = await postsService.createPost({ post });
      res.status(201).json({
        data: createdPostId,
        message: "post created",
      });
    } catch (err) {
      next(err);
    }
  });

  router.put("/:postId", async function (req, res, next) {
    try {
      const { postId } = req.params;
      const { body: post } = req;
      if (!ObjectId.isValid(postId)) throw new Error("Invalid id");
      const updatedPostId = await postsService.updatePost({ postId, post });
      res.status(200).json({
        data: updatedPostId,
        message: "post updated",
      });
    } catch (err) {
      next(err);
    }
  });

  router.delete("/:postId", async function (req, res, next) {
    try {
      const { postId } = req.params;
      if (!ObjectId.isValid(postId)) throw new Error("Invalid id");
      const deletedPostId = await postsService.deletePost({ postId });
      res.status(200).json({
        data: deletedPostId,
        message: "post deleted",
      });
    } catch (err) {
      next(err);
    }
  });
}

module.exports = postsApi;
