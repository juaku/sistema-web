const express = require("express");
var ObjectId = require("mongoose").Types.ObjectId;
const TagsService = require("../services/tags");

function tagsApi(app) {
  const router = express.Router();
  app.use("/api/tags", router);

  const tagsService = new TagsService();

  router.get("/", async function (req, res, next) {
    try {
      const tags = await tagsService.getTags();
      res.status(200).json({
        data: tags,
        message: "tags listed",
      });
    } catch (err) {
      next(err);
    }
  });

  router.get("/:id", async function (req, res, next) {
    try {
      const { id } = req.params;
      let query;
      if (!ObjectId.isValid(id)) {
        query = { tag: id };
      } else {
        query = { _id: id };
      }

      const tag = await tagsService.getTag(query);
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
      const createdTagId = await tagsService.createTag({ tag });
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
      if (!ObjectId.isValid(tagId)) throw new Error("Invalid id");
      const updatedTagId = await tagsService.updateTag({ tagId, tag });
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
      if (!ObjectId.isValid(tagId)) throw new Error("Invalid id");
      const deletedTagId = await tagsService.deleteTag({ tagId });
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
