/**
 * B2B portal email helpers.
 * Uses Resend (same as notifications.ts) for transactional emails.
 */
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM ?? "noreply@resend.dev";

/** Send email verification link to new B2B user */
export async function sendB2bVerifyEmail(
  to: string,
  name: string,
  token: string,
  origin: string,
): Promise<void> {
  const verifyUrl = `${origin}/api/b2b/verify?token=${token}`;

  await resend.emails.send({
    from: FROM,
    to,
    subject: "Подтвердите ваш email — B2B Личный кабинет",
    html: `
<!DOCTYPE html>
<html lang="ru">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:system-ui,sans-serif">
  <div style="max-width:520px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
    <div style="background:#001A33;padding:28px 32px;display:flex;align-items:center;gap:12px">
      <div style="width:36px;height:36px;background:#F97316;border-radius:9px;display:flex;align-items:center;justify-content:center">
        <svg viewBox="0 0 20 20" fill="none" width="22" height="22">
          <rect x="3" y="4" width="6" height="12" rx="1" fill="white" opacity="0.9"/>
          <rect x="11" y="4" width="6" height="12" rx="1" fill="white" opacity="0.7"/>
        </svg>
      </div>
      <span style="color:#fff;font-size:17px;font-weight:700">B2B / B2G Личный кабинет</span>
    </div>
    <div style="padding:32px">
      <h1 style="font-size:22px;font-weight:800;color:#001A33;margin:0 0 12px">Подтвердите ваш email</h1>
      <p style="font-size:15px;color:#4B5563;margin:0 0 24px;line-height:1.6">
        Здравствуйте, <strong>${name}</strong>!<br>
        Для завершения регистрации в B2B-кабинете нажмите кнопку ниже.
      </p>
      <a href="${verifyUrl}" style="display:inline-block;background:#F97316;color:#fff;text-decoration:none;padding:13px 28px;border-radius:10px;font-size:15px;font-weight:700">
        Подтвердить email
      </a>
      <p style="font-size:13px;color:#9CA3AF;margin:24px 0 0;line-height:1.5">
        Ссылка действительна 24 часа. Если вы не регистрировались — просто проигнорируйте это письмо.
      </p>
      <hr style="border:none;border-top:1px solid #F3F4F6;margin:24px 0">
      <p style="font-size:12px;color:#9CA3AF;margin:0">
        Ссылка для копирования: <a href="${verifyUrl}" style="color:#F97316;word-break:break-all">${verifyUrl}</a>
      </p>
    </div>
  </div>
</body>
</html>`,
    text: `Здравствуйте, ${name}!\n\nПодтвердите ваш email по ссылке:\n${verifyUrl}\n\nСсылка действительна 24 часа.`,
  });
}

/** Send password reset link */
export async function sendB2bPasswordResetEmail(
  to: string,
  name: string,
  token: string,
  origin: string,
): Promise<void> {
  const resetUrl = `${origin}/b2b/reset-password?token=${token}`;

  await resend.emails.send({
    from: FROM,
    to,
    subject: "Сброс пароля — B2B Личный кабинет",
    html: `
<!DOCTYPE html>
<html lang="ru">
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:system-ui,sans-serif">
  <div style="max-width:520px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
    <div style="background:#001A33;padding:28px 32px">
      <span style="color:#fff;font-size:17px;font-weight:700">B2B / B2G Личный кабинет</span>
    </div>
    <div style="padding:32px">
      <h1 style="font-size:22px;font-weight:800;color:#001A33;margin:0 0 12px">Сброс пароля</h1>
      <p style="font-size:15px;color:#4B5563;margin:0 0 24px;line-height:1.6">
        Здравствуйте, <strong>${name}</strong>!<br>
        Нажмите кнопку ниже чтобы задать новый пароль.
      </p>
      <a href="${resetUrl}" style="display:inline-block;background:#F97316;color:#fff;text-decoration:none;padding:13px 28px;border-radius:10px;font-size:15px;font-weight:700">
        Сбросить пароль
      </a>
      <p style="font-size:13px;color:#9CA3AF;margin:24px 0 0">
        Ссылка действительна 1 час. Если вы не запрашивали сброс — игнорируйте письмо.
      </p>
    </div>
  </div>
</body>
</html>`,
    text: `Сброс пароля: ${resetUrl}`,
  });
}
