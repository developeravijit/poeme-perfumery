// OTP Template
const otpTemplate = (name, otp) => {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8" />
    <title>Email Verification</title>
  </head>
  <body style="margin:0;padding:40px 20px;background:#f4f4f4;font-family:Arial,sans-serif;">

    <div style="
      max-width:600px;
      margin:0 auto;
      background:#ffffff;
      border-radius:10px;
      overflow:hidden;
      box-shadow:0 2px 10px rgba(0,0,0,0.08);
    ">

      <div style="
        background:#1f2937;
        padding:30px;
        text-align:center;
      ">
        <h1 style="
          color:#ffffff;
          margin:0;
          font-size:28px;
        ">
          Email Verification
        </h1>
      </div>

      <div style="padding:40px 30px;">

        <h2 style="
          color:#333333;
          margin-top:0;
        ">
          Hello ${name},
        </h2>

        <p style="
          font-size:16px;
          line-height:1.8;
          color:#555555;
        ">
          Thank you for registering. To complete your account verification,
          please use the OTP below.
        </p>

        <div style="
          text-align:center;
          margin:35px 0;
        ">
          <div style="
            display:inline-block;
            padding:15px 35px;
            background:#f3f4f6;
            border-radius:8px;
            font-size:32px;
            font-weight:bold;
            letter-spacing:8px;
            color:#1f2937;
          ">
            ${otp}
          </div>
        </div>

        <div style="
          background:#f9fafb;
          border-left:4px solid #1f2937;
          padding:15px;
          border-radius:4px;
          margin:25px 0;
        ">
          <p style="
            margin:0;
            color:#555555;
            line-height:1.6;
          ">
            This OTP is valid for <strong>10 minutes</strong>.
            Do not share it with anyone.
          </p>
        </div>

        <p style="
          font-size:16px;
          line-height:1.8;
          color:#555555;
        ">
          If you did not request this verification, please ignore this email.
        </p>

        <p style="
          margin-top:30px;
          color:#333333;
        ">
          Regards,<br>
          <strong>Your Company Name</strong>
        </p>

      </div>

      <div style="
        text-align:center;
        padding:20px;
        background:#f9fafb;
        color:#6b7280;
        font-size:13px;
      ">
        © 2026 Your Company Name. All rights reserved.
      </div>

    </div>

  </body>
  </html>
  `;
};

module.exports = {
  otpTemplate,
};
