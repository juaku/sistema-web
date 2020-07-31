module.exports = function (server) {
  var io = require("socket.io")(server);

  io.on("connection", function (socket) {
    console.log("Un usario se ha conectado!");

    socket.on("showPost", function (mediaName) {
      mediaName = mediaName + ".jpg";
      io.sockets.emit("showPost", mediaName);
    });

    socket.on("joinChannel", function (channel) {
      var pathRegExp = new RegExp(
        /^((?:[0-9A-Fa-f]{3})\.(?:[A-Za-záéíóúàèìòùäëïöüÿâêîôûçæœãõñÁÉÍÓÚÀÈÌÒÙÄËÏÖÜŸÂÊÎÔÛÇÆŒÃÕÑß%]{3,}))?(?:@([0-9A-Za-záéíóúàèìòùäëïöüÿâêîôûçæœãõñÁÉÍÓÚÀÈÌÒÙÄËÏÖÜŸÂÊÎÔÛÇÆŒÃÕÑß%]{3,}))?$|^([0-9A-Za-záéíóúàèìòùäëïöüÿâêîôûçæœãõñÁÉÍÓÚÀÈÌÒÙÄËÏÖÜŸÂÊÎÔÛÇÆŒÃÕÑß%]{3,})$|^([p\/0-9a-fA-F]+)$/g
      );
      var path = pathRegExp.exec(channel);
      if (path[0]) {
        if (path[1]) {
          if (path[2]) {
            socket.join(channel);
          }
        }
      }
    });

    socket.on("showPostSaved", function (post) {
      io.to(post.channelTo).emit("showInChannel", post.media); // transmitido a todos en la sala
    });

    socket.on("disconnect", function () {
      console.log("Se deconectó un usario!!!!");
    });
  });
};
