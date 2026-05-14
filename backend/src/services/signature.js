import crypto from 'node:crypto';

export const createHmacSha256 = (payload, secret) =>
  crypto.createHmac('sha256', secret).update(payload).digest('hex');

export const verifyWebhookSignature = (payload, signature, secret) => {
  if (!signature || !secret) {
    return false;
  }

  const expected = createHmacSha256(payload, secret);
  const expectedBuffer = Buffer.from(expected, 'hex');
  const receivedBuffer = Buffer.from(signature, 'hex');

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
};
