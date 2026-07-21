const transporter = require("../config/transporter");
const Otp = require("../model/otp");

const otpEmail = async (user) => {
  try {
    if (user.isVerified) {
      throw new Error("User already verified");
    }
    const otp = Math.floor(100000 + Math.random() * 900000);
    const data = new Otp({
      userID: user._id,
      otp,
    });

    await data.save();

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: "Your verification code",
      html: otpTemplate(user.name, otp),
    });

    return otp;
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = {
  otpEmail,
};
