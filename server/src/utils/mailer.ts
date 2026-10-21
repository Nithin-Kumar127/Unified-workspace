import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || '',
  },
});

const escapeHtml = (value: string): string =>
  value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return entities[character] ?? character;
  });

export const sendProjectInviteEmail = async (
  recipientEmail: string,
  projectName: string,
  inviterName: string,
  inviteLink: string
) => {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;
  if (!emailUser || !emailPass) {
    throw new Error('EMAIL_USER and EMAIL_PASS must be configured to send project invites');
  }

  const link = new URL(inviteLink);
  if (link.protocol !== 'http:' && link.protocol !== 'https:') {
    throw new Error('Project invitation link must use HTTP or HTTPS');
  }

  return transporter.sendMail({
    from: { name: 'Unified Workspace', address: emailUser },
    to: recipientEmail,
    subject: `You've been invited to join project: ${projectName.replace(/[\r\n]/g, ' ')}`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #1a1a1a; color: #ffffff; border-radius: 8px;">
        <h2 style="color: #6366f1;">Workspace Invitation</h2>
        <p>Hello,</p>
        <p><strong>${escapeHtml(inviterName)}</strong> has added you to the project: <strong>${escapeHtml(projectName)}</strong> on Unified Workspace.</p>
        <p style="margin-top: 20px;">
          <a href="${escapeHtml(link.toString())}" style="background-color: #6366f1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Open Project Workspace
          </a>
        </p>
        <p style="font-size: 12px; color: #9ca3af; margin-top: 30px;">If you weren't expecting this invitation, you can safely ignore this email.</p>
      </div>
    `,
  });
};
