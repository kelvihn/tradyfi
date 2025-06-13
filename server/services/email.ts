import nodemailer from "nodemailer";

const emailTransporter = nodemailer.createTransport({
  host: 'smtp.sendgrid.net',
  port: 587,
  secure: false,
  auth: {
    user: 'apikey',
    pass: process.env.SMTP_PASS
  },
});

export emailTransporter;