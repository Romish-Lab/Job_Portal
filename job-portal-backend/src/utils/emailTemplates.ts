export const passwordResetTemplate = (resetUrl: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>

<body style="
  margin: 0;
  padding: 0;
  background-color: #f4f7f6;
  font-family: Arial, Helvetica, sans-serif;
">

  <div style="
    max-width: 600px;
    margin: 40px auto;
    background: #ffffff;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 8px 30px rgba(0,0,0,0.08);
  ">

    <!-- Header -->
    <div style="
      background: linear-gradient(135deg, #111827, #1f2937);
      padding: 35px 30px;
      text-align: center;
    ">
      <h1 style="
        margin: 0;
        color: #ffffff;
        font-size: 28px;
        letter-spacing: -0.5px;
      ">
        Password Reset
      </h1>

      <p style="
        margin: 10px 0 0;
        color: #9ca3af;
        font-size: 14px;
      ">
        Let's get you back into your account.
      </p>
    </div>

    <!-- Content -->
    <div style="padding: 40px 35px;">

      <h2 style="
        margin-top: 0;
        color: #111827;
        font-size: 22px;
      ">
        Forgot your password?
      </h2>

      <p style="
        color: #4b5563;
        font-size: 15px;
        line-height: 1.7;
      ">
        No worries. We received a request to reset the password
        associated with your account.
      </p>

      <p style="
        color: #4b5563;
        font-size: 15px;
        line-height: 1.7;
      ">
        Click the button below to create a new password.
      </p>

      <!-- Button -->
      <div style="
        text-align: center;
        margin: 35px 0;
      ">
        <a href="${resetUrl}"
           target="_blank"
           style="
             display: inline-block;
             padding: 15px 32px;
             background: #10b981;
             color: #ffffff;
             text-decoration: none;
             font-size: 15px;
             font-weight: bold;
             border-radius: 10px;
             box-shadow: 0 5px 15px rgba(16,185,129,0.25);
           ">
          Reset My Password
        </a>
      </div>

      <!-- Expiry Notice -->
      <div style="
        background: #f0fdf4;
        border-left: 4px solid #10b981;
        padding: 14px 16px;
        border-radius: 8px;
        margin-bottom: 25px;
      ">
        <p style="
          margin: 0;
          color: #166534;
          font-size: 13px;
          line-height: 1.6;
        ">
          🔒 For your security, this link will expire in
          <strong>10 minutes</strong>.
        </p>
      </div>

      <p style="
        color: #6b7280;
        font-size: 13px;
        line-height: 1.6;
      ">
        If you didn't request a password reset, you can safely ignore
        this email. Your password will remain unchanged.
      </p>

      <!-- Fallback URL -->
      <p style="
        color: #9ca3af;
        font-size: 11px;
        line-height: 1.6;
        word-break: break-all;
        margin-top: 30px;
      ">
        If the button doesn't work, copy and paste this link into your browser:
        <br><br>
        <a href="${resetUrl}"
           target="_blank"
           style="color: #10b981;">
          ${resetUrl}
        </a>
      </p>

    </div>

    <!-- Footer -->
    <div style="
      background: #f9fafb;
      padding: 22px;
      text-align: center;
      border-top: 1px solid #e5e7eb;
    ">
      <p style="
        margin: 0;
        color: #9ca3af;
        font-size: 12px;
      ">
        © 2026 Job Portal. All rights reserved.
      </p>

      <p style="
        margin: 7px 0 0;
        color: #d1d5db;
        font-size: 11px;
      ">
        This is an automated security email. Please don't reply.
      </p>
    </div>

  </div>

</body>
</html>
`;

export const interviewScheduledTemplate = (details: {
  jobTitle: string;
  company: string;
  type: string;
  scheduledDate: Date;
  duration: number;
  location?: string;
  meetingLink?: string;
  notes?: string;
}) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f4f7f6; font-family: Arial, sans-serif;">
  <div style="max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 30px rgba(0,0,0,0.08);">
    <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 35px 30px; text-align: center;">
      <h1 style="margin: 0; color: #ffffff; font-size: 28px;">Interview Scheduled! 🎉</h1>
    </div>

    <div style="padding: 40px 35px;">
      <h2 style="margin-top: 0; color: #111827; font-size: 22px;">Great news!</h2>

      <p style="color: #4b5563; font-size: 15px; line-height: 1.7;">
        You have been invited for an interview for the position of <strong>${details.jobTitle}</strong> at <strong>${details.company}</strong>.
      </p>

      <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; border-radius: 8px; margin: 25px 0;">
        <h3 style="margin: 0 0 15px 0; color: #166534; font-size: 16px;">Interview Details</h3>
        <p style="margin: 5px 0; color: #166534; font-size: 14px;"><strong>Type:</strong> ${details.type.charAt(0).toUpperCase() + details.type.slice(1)}</p>
        <p style="margin: 5px 0; color: #166534; font-size: 14px;"><strong>Date & Time:</strong> ${details.scheduledDate.toLocaleString()}</p>
        <p style="margin: 5px 0; color: #166534; font-size: 14px;"><strong>Duration:</strong> ${details.duration} minutes</p>
        ${details.location ? `<p style="margin: 5px 0; color: #166534; font-size: 14px;"><strong>Location:</strong> ${details.location}</p>` : ""}
        ${details.meetingLink ? `<p style="margin: 5px 0; color: #166534; font-size: 14px;"><strong>Meeting Link:</strong> <a href="${details.meetingLink}" style="color: #10b981;">${details.meetingLink}</a></p>` : ""}
      </div>

      ${details.notes ? `<p style="color: #4b5563; font-size: 14px; line-height: 1.6;"><strong>Additional Notes:</strong><br>${details.notes}</p>` : ""}

      <div style="text-align: center; margin: 35px 0;">
        <a href="${process.env.CLIENT_URL}/interviews"
           style="display: inline-block; padding: 15px 32px; background: #10b981; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: bold; border-radius: 10px; box-shadow: 0 5px 15px rgba(16,185,129,0.25);">
          View Interview Details
        </a>
      </div>

      <p style="color: #6b7280; font-size: 13px; line-height: 1.6;">
        Good luck with your interview! Make sure to prepare and arrive on time.
      </p>
    </div>

    <div style="background: #f9fafb; padding: 22px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="margin: 0; color: #9ca3af; font-size: 12px;">© 2026 Job Portal. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;
