/**
 * Transactional email via Resend.
 * Requires RESEND_API_KEY env var.
 */

import { Resend } from 'resend';
import type { Grant } from './grant-cache';

function getResend(): Resend {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('RESEND_API_KEY is not configured.');
  return new Resend(key);
}

export async function sendDeadlineAlert(
  to: string,
  grant: Grant,
  daysLeft: number,
): Promise<void> {
  const resend = getResend();

  const urgency = daysLeft === 1 ? '⚠️ Last day!' : `${daysLeft} days left`;
  const subject = `Grant deadline reminder: "${grant.title}" — ${urgency}`;

  await resend.emails.send({
    from: 'Nexar AI <onboarding@resend.dev>',
    to,
    subject,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #111;">Grant Deadline Reminder</h2>
        <p>Your saved grant is closing soon:</p>
        <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <h3 style="margin: 0 0 8px;">${grant.title}</h3>
          <p style="color: #6b7280; margin: 0 0 8px;">${grant.agency}</p>
          <p style="margin: 0 0 8px;"><strong>Deadline:</strong> ${grant.deadline}</p>
          <p style="margin: 0 0 8px;"><strong>Award Amount:</strong> ${grant.award_amount}</p>
          <p style="color: ${daysLeft === 1 ? '#dc2626' : '#d97706'}; font-weight: bold;">
            ${urgency}
          </p>
          ${grant.url ? `<a href="${grant.url}" style="color: #2563eb;">View grant →</a>` : ''}
        </div>
        <p style="color: #6b7280; font-size: 14px;">
          You're receiving this because you saved this grant in Nexar AI.
        </p>
      </div>
    `,
  });
}
