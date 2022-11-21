import nodemailer from 'nodemailer';

class MailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: 'gray.lobstery@gmail.com',
        pass: 'gdqeenroatatvqqp',
      },
    });
  }

  async sendActivationMail(to, link) {
    await this.transporter.sendMail({
      from: process.env.SMTP_USER,
      to,
      subject: 'Activating account on ' + process.env.API_URL,
      text: '',
      html: `
        <div>
          <h1>To activate account follow the link</h1>
          <h3><a href="${link}">Activate account</a></h3>
        </div>
      `,
    });
  }
}
export default new MailService();
