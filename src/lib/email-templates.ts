/**
 * Professional HTML Email Templates for Mandir Samiti Bahpura.
 */

export function getOtpEmailHtml(otp: string, language: 'hi' | 'en') {
  const isHi = language === 'hi';
  const title = isHi ? 'आपका सत्यापन कोड - सूर्य मंदिर ' : 'Your Verification Code - Surya Mandir';
  const greeting = isHi ? 'नमस्ते,' : 'Namaste,';
  const instruction = isHi 
    ? 'मंदिर समिति बहपुरा में आपका स्वागत है। अपने खाते को सत्यापित करने के लिए कृपया नीचे दिए गए कोड का उपयोग करें:' 
    : 'Welcome to Mandir Samiti Bahpura. Please use the code below to verify your account:';
  const validMsg = isHi 
    ? 'यह कोड १० मिनट के लिए वैध है।' 
    : 'This code is valid for 10 minutes.';
  const footerMsg = isHi 
    ? 'यदि आपने यह अनुरोध नहीं किया है, तो कृपया इस ईमेल को अनदेखा करें।' 
    : 'If you did not request this, please ignore this email.';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #fef8e7; padding: 20px; color: #333; margin: 0; }
        .container { background-color: #ffffff; padding: 40px; border-radius: 16px; border: 1px solid #f0d0a0; max-width: 500px; margin: 0 auto; text-align: center; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .header { color: #d97706; font-size: 24px; font-weight: 800; margin-bottom: 24px; text-transform: uppercase; letter-spacing: 1px; }
        .otp-box { font-size: 38px; font-weight: 800; color: #7f1d1d; letter-spacing: 8px; background-color: #fffbeb; padding: 20px; border-radius: 12px; border: 2px dashed #f59e0b; display: inline-block; margin: 25px 0; }
        .message { font-size: 16px; line-height: 1.6; color: #4b5563; }
        .validity { font-size: 14px; color: #b45309; font-weight: 600; margin-top: 10px; }
        .footer { font-size: 12px; color: #9ca3af; margin-top: 40px; border-top: 1px solid #eee; pt: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">Mandir Samiti Bahpura</div>
        <p class="message"><strong>${greeting}</strong></p>
        <p class="message">${instruction}</p>
        <div class="otp-box">${otp}</div>
        <p class="validity">${validMsg}</p>
        <div class="footer">
          <p>${footerMsg}</p>
          <p>© 2025 Mandir Samiti Bahpura - Bihta Dist. Patna, Bihar</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
