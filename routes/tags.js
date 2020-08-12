const express = require("express");
const { mockDocument } = require("../utils/mocks/mock");

function tagsApi(app) {
  const router = express.Router();
  app.use("/api/tags", router);

  router.get("/", async function (req, res, next) {
    try {
      const tags = await Promise.resolve(mockDocument);
      res.status(200).json({
        data: tags,
        message: "tags listed",
      });
    } catch (err) {
      next(err);
    }
  });

  router.get("/:tagId", async function (req, res, next) {
    try {
      const { tagId } = req.params;
      const tag = await Promise.resolve(mockDocument[0]);
      res.status(200).json({
        data: tag,
        message: "tag retrieved",
      });
    } catch (err) {
      next(err);
    }
  });

  router.post("/", async function (req, res, next) {
    try {
      const { body: tag } = req;
      const createdTagId = await Promise.resolve(mockDocument[0]._id);
      res.status(201).json({
        data: createdTagId,
        message: "tag created",
      });
    } catch (err) {
      next(err);
    }
  });

  router.put("/:tagId", async function (req, res, next) {
    try {
      const { tagId } = req.params;
      const { body: tag } = req;
      const updatedTagId = await Promise.resolve(mockDocument[0]._id);
      res.status(200).json({
        data: updatedTagId,
        message: "tag updated",
      });
    } catch (err) {
      next(err);
    }
  });

  router.delete("/:tagId", async function (req, res, next) {
    try {
      const { tagId } = req.params;
      const deletedTagId = await Promise.resolve(mockDocument[0]._id);
      res.status(200).json({
        data: deletedTagId,
        message: "tag deleted",
      });
    } catch (err) {
      next(err);
    }
  });
}

module.exports = tagsApi;
