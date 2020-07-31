var mongoose = require("mongoose");
var mongoosastic = require("mongoosastic");
var Schema = mongoose.Schema;
var fs = require("fs");
var FB = require("fb");

require("./action");
require("./user");

var TagSchema = new Schema({
  tag: {
    type: String,
    es_indexed: true,
    es_analyzer: "autocomplete",
    es_search_analyzer: "standard",
  },
  posts: [{ type: Schema.Types.ObjectId, ref: "Post" }],
  createdAt: { type: Date, default: Date.now },
});

TagSchema.plugin(mongoosastic, {
  hosts: ["localhost:9200"],
});

/*
 * @descrip Retorna un objecto tag si es que está almacenado en la bd
 * @par {object} req, {function} callback, {function} error.
 * @return {object} tag
 */
TagSchema.statics.getTagId = function (req, callback, error) {
  var tag = req.session.path;
  this.findOne({ tag: tag })
    .select("tag")
    .exec(function (err, tag) {
      if (err) return handleError(err);
      if (tag != null) {
        callback(tag);
      } else {
        console.log("NO EXISTE tal tag");
        error();
      }
    });
};

/*
 * @descrip Crea nuevo post, si el tag no existe se crea uno, y se hace referencia a los posts de cada modelo User y Tag
 * @par {object} req, {function} callback, {function} error.
 * @return // TODO: que retorna
 */
TagSchema.statics.newPost = function (req, callback, error) {
  var Post = mongoose.model("Post");
  var User = mongoose.model("User");
  var newPost = req.body;
  var currentUserId = req.session.idMongoDb;
  var mediaName = parseInt(Math.random(255, 2) * 10000);
  var mediaExt = "jpg";
  var FB = require("fb");
  if (newPost.coords == undefined) {
    newPost.coords = {};
    newPost.coords.latitude = -16.3989;
    newPost.coords.longitude = -71.535;
  }
  var coords = [];
  coords[0] = newPost.coords.latitude;
  coords[1] = newPost.coords.longitude;
  this.findOne({ tag: newPost.simpleTag }, function (err, tag) {
    var objectTag = tag;
    saveMedia(newPost.media, mediaName, mediaExt);
    if (err) throw err;
    console.log(coords);
    var post = new Post({
      simpleTag: newPost.simpleTag,
      tag: newPost.tag,
      geo: coords,
      media: mediaName + "." + mediaExt,
      active: true,
      authorId: currentUserId,
    });
    post.save(function (err) {
      if (err) error();
      User.update(
        { _id: currentUserId },
        { $push: { posts: post._id } },
        function (err, doc) {
          if (err) error();
          console.log("post referenciada a user");
          console.log(doc);
          if (objectTag != null) {
            Post.findOneAndUpdate(
              { _id: post._id },
              { $set: { tagId: objectTag._id } },
              { new: true },
              function (err, doc) {
                if (err) error();
              }
            );
            objectTag.posts.push(post._id);
            objectTag.save();
            console.log("Acción referenciada a tag");
          } else {
            var Tag = mongoose.model("Tag", TagSchema);
            var tag = new Tag();
            tag.tag = newPost.simpleTag;
            tag.posts = post._id;
            tag.save(function (err) {
              if (err) error();
              Post.findOneAndUpdate(
                { _id: post._id },
                { $set: { tagId: tag._id } },
                { new: true },
                function (err, doc) {
                  if (err) error();
                }
              );
              console.log("Tag guardado y acción referenciada");
            });
          }
        }
      );
      post.on("es-indexed", function (err, res) {
        if (err) throw err;
        /* Document is indexed */
        console.log("El post se guardó en elastic también!");
      });
      callback(mediaName);
    });
    if (newPost.shareOnFb) {
      var url =
        "http://juaku-dev.cloudapp.net:3000/uploads/" +
        mediaName +
        "." +
        mediaExt;
      shareMediaOnFb(req, url);
    }
    function shareMediaOnFb(req, url) {
      var albumId = "";
      FB.api(
        "/" + albumId + "/photos",
        "POST",
        {
          url: url,
          access_token: req.session.accessToken,
        },
        function (response) {
          if (response && !response.error) {
            // handle the result
            console.log("Foto compartida en facebook exitósamente");
          } else {
            console.log("Error, foto no compartida");
          }
        }
      );
    }
  });
  function saveMedia(data, name, ext) {
    console.log("saveMedia");
    console.log(name + "." + ext);
    var img = data;
    // Strip off the data: url prefix to get just the base64-encoded bytes
    var data = img.replace(/^data:image\/\w+;base64,/, "");
    var buf = new Buffer(data, "base64");
    // TODO: Verificación de archivo
    fs.writeFile("./public/uploads/" + name + "." + ext, buf);
    console.log("IMAGEN GUARDADA EN SERVIDOR!!!!!!!!");
    //next(data); || return data;
  }
};

/*
 * @descrip Edita tag de un post propio
 * @par {object} req, {function} callback, {function} error.
 * @return null
 */
TagSchema.statics.updateTag = function (req, callback, error) {
  var Post = mongoose.model("Post");
  var User = mongoose.model("User");
  var post = req.body;
  var currentUserId = req.session.idMongoDb;
  var oldTag = post.tagToBeChanged;
  var newTag = simplifyName(post.newTag);

  var FB = require("fb");
  if (post.oldTag != newTag) {
    // Compara si el tag nuevo es igual al anterior
    if (
      post.author.id == currentUserId &&
      oldTag != newTag &&
      newTag != "" &&
      newTag != undefined
    ) {
      // Remueve POST referenciado a TAG antiguo
      this.update({ tag: oldTag }, { $pull: { posts: post.id } }, function (
        err,
        doc
      ) {
        if (err) error();
        console.log("post removida de tag: " + oldTag);
        console.log(doc);
      });
      // Actualiza simpleTag y tag
      // findOneAndUpdate de mongoose actualizará automáticamente la data dentro de elastic siempre y cuando new: true esté seteado en las opciones
      Post.findOneAndUpdate(
        { _id: post.id },
        { $set: { simpleTag: newTag } },
        { new: true },
        function (err, doc) {
          if (err) error();
          console.log("Actualización de simpleTag: " + newTag);
          console.log(doc);
        }
      );
      Post.update({ _id: post.id }, { $set: { tag: post.newTag } }, function (
        err,
        doc
      ) {
        if (err) error();
        console.log("Actualización de tag: " + post.newTag);
        console.log(doc);
      });
      // Referencia POST a nuevo TAG
      this.findOne({ tag: newTag }, function (err, objectTag) {
        if (err) throw err;
        if (objectTag != null) {
          Post.findOneAndUpdate(
            { _id: post.id },
            { $set: { tagId: objectTag._id } },
            { new: true },
            function (err, doc) {
              if (err) error();
            }
          );
          objectTag.posts.push(post.id);
          objectTag.save();
          console.log("Acción referenciada a tag");
        } else {
          var Tag = mongoose.model("Tag", TagSchema);
          var tag = new Tag();
          tag.tag = newTag;
          //tag.originalTag = post.newTag;
          tag.posts = post.id;
          tag.save(function (err) {
            if (err) error();
            Post.findOneAndUpdate(
              { _id: post.id },
              { $set: { tagId: tag._id } },
              { new: true },
              function (err, doc) {
                if (err) error();
              }
            );
            console.log("Tag guardado y acción referenciada");
          });
        }
      });
      callback();
    }
  }
};

function simplifyName(tag) {
  console.log("simplifyName " + tag);
  var diacritics = [
    { re: /[\xC0-\xC6]/g, ch: "A" },
    { re: /[\xE0-\xE6]/g, ch: "a" },
    { re: /[\xC8-\xCB]/g, ch: "E" },
    { re: /[\xE8-\xEB]/g, ch: "e" },
    { re: /[\xCC-\xCF]/g, ch: "I" },
    { re: /[\xEC-\xEF]/g, ch: "i" },
    { re: /[\xD2-\xD6]/g, ch: "O" },
    { re: /[\xF2-\xF6]/g, ch: "o" },
    { re: /[\xD9-\xDC]/g, ch: "U" },
    { re: /[\xF9-\xFC]/g, ch: "u" },
    { re: /[\xD1]/g, ch: "N" },
    { re: /[\xF1]/g, ch: "n" },
    { re: /[\307]/g, ch: "C" },
    { re: /[\347]/g, ch: "c" },
  ];
  for (var i = 0; i < diacritics.length; i++) {
    tag = tag.replace(diacritics[i].re, diacritics[i].ch);
  }
  return tag.toLowerCase();
}

module.exports = mongoose.model("Tag", TagSchema);
