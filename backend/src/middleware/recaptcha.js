import axios from 'axios';

const RECAPTCHA_SECRET = process.env.RECAPTCHA_SECRET_KEY || '6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe';

export async function verifyRecaptcha(token) {
  if (!token) return false;
  try {
    const { data } = await axios.post('https://www.google.com/recaptcha/api/siteverify', null, {
      params: { secret: RECAPTCHA_SECRET, response: token },
    });
    return data.success;
  } catch {
    return false;
  }
}

export function recaptchaMiddleware(req, res, next) {
  const token = req.body.recaptcha_token;
  if (!token) {
    return res.status(400).json({ error: 'reCAPTCHA é obrigatório' });
  }
  verifyRecaptcha(token).then((valid) => {
    if (!valid) {
      return res.status(400).json({ error: 'reCAPTCHA inválido. Tente novamente.' });
    }
    next();
  }).catch(() => {
    res.status(500).json({ error: 'Erro ao verificar reCAPTCHA' });
  });
}
