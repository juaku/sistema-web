const express = require("express");
const { mockDocument } = require("../utils/mocks/mock");

function postsApi(app) {
  const router = express.Router();
  app.use("/api/posts", router);

  router.get("/", async function (req, res, next) {
    try {
      const posts = await Promise.resolve(mockDocument);
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
      const post = await Promise.resolve(mockDocument[0]);
      res.status(200).json({
        data: post,
        message: "post retrieve",
      });
    } catch (err) {
      next(err);
    }
  });

  router.post("/", async function (req, res, next) {
    try {
      const createdPostId = await Promise.resolve(mockDocument[0]._id);
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
      const updatedPostId = await Promise.resolve(mockDocument[0]._id);
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
      const deletedPostId = await Promise.resolve(mockDocument[0]._id);
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
