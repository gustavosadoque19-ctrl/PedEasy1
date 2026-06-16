import ReCAPTCHA from 'react-google-recaptcha';
import { useRef, forwardRef, useImperativeHandle } from 'react';

const SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI';

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
