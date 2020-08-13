const mongoose = require("mongoose");
const { config } = require("../config/index");

const USER = config.dbUser;
const PASSWORD = config.dbPassword;
const DB_HOST = config.dbHost;
const DB_NAME = config.dbName;
var ObjectId = require("mongoose").Types.ObjectId;

const MONGO_URI = `mongodb+srv://${DB_HOST}/${DB_NAME}?retryWrites=true&w=majority`;
const OPTIONS = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
};

class MongoLib {
  constructor() {
    this.mongo_uri = MONGO_URI;
    this.options = OPTIONS;
  }

  // Connect to DB using singleton pattern
  connect() {
    if (!MongoLib.connection) {
      MongoLib.connection = mongoose
        .connect(this.mongo_uri, this.options)
        .then(() => console.log("Connected!"))
        .catch((err) => console.log(err));
    }

    // CONNECTION EVENTS
    // When successfully connected
    mongoose.connection.on("connected", function () {
      console.log(`Mongoose default connection open to ${MONGO_URI}`);
    });

    // If the connection throws an error
    mongoose.connection.on("error", function (err) {
      console.log(`Mongoose default connection error: ${err}`);
    });

    // When the connection is disconnected
    mongoose.connection.on("disconnected", function () {
      console.log("Mongoose default connection disconnected");
    });

    return MongoLib.connection;
  }
}

module.exports = MongoLib;
