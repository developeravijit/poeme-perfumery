const mongoose = require("mongoose");

const DbConnect = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log(`Mongodb Connected Server on ${process.env.MONGODB_URI}`);
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = DbConnect;
