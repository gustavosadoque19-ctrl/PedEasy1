import ReCAPTCHA from 'react-google-recaptcha';
import { useRef, forwardRef, useImperativeHandle } from 'react';

const SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
if (!SITE_KEY && import.meta.env.PROD) {
  console.error('VITE_RECAPTCHA_SITE_KEY não configurada');
}

export interface ReCaptchaHandle {
  getToken: () => string | null;
  reset: () => void;
}

const ReCaptcha = forwardRef<ReCaptchaHandle>((_props, ref) => {
  const captchaRef = useRef<ReCAPTCHA>(null);

  useImperativeHandle(ref, () => ({
    getToken: () => captchaRef.current?.getValue() || null,
    reset: () => captchaRef.current?.reset(),
  }));

  if (!SITE_KEY) return null;

  return (
    <ReCAPTCHA
      ref={captchaRef}
      sitekey={SITE_KEY}
      size="normal"
    />
  );
});

ReCaptcha.displayName = 'ReCaptcha';
export default ReCaptcha;
