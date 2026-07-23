const cron = require("node-cron");
const User = require("../model/user");

cron.schedule("*/30 * * * *", async () => {
  try {
    const twohour = new Date(Date.now() - 2 * 60 * 60 * 1000);

    const result = await User.deleteMany({
      isVerified: false,
      createdAt: {
        $lt: twohour,
      },
    });

    console.log(`Unverified user deleted ${result.deletedCount}`);
  } catch (error) {
    console.log(error.message);
  }
});

module.exports = cron;
