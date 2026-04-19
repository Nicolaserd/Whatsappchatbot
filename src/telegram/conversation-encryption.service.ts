import { Injectable, InternalServerErrorException } from '@nestjs/common';
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'crypto';

@Injectable()
export class ConversationEncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly ivLength = 12;

  encrypt(value: string) {
    const iv = randomBytes(this.ivLength);
    const cipher = createCipheriv(this.algorithm, this.getKey(), iv);
    const encrypted = Buffer.concat([
      cipher.update(value, 'utf8'),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();

    return [
      'v1',
      iv.toString('base64'),
      authTag.toString('base64'),
      encrypted.toString('base64'),
    ].join(':');
  }

  decrypt(value: string) {
    const [version, iv, authTag, encrypted] = value.split(':');

    if (version !== 'v1' || !iv || !authTag || !encrypted) {
      return value;
    }

    const decipher = createDecipheriv(
      this.algorithm,
      this.getKey(),
      Buffer.from(iv, 'base64'),
    );
    decipher.setAuthTag(Buffer.from(authTag, 'base64'));

    return Buffer.concat([
      decipher.update(Buffer.from(encrypted, 'base64')),
      decipher.final(),
    ]).toString('utf8');
  }

  private getKey() {
    const secret = process.env.CONVERSATION_ENCRYPTION_KEY;

    if (!secret) {
      throw new InternalServerErrorException(
        'Missing CONVERSATION_ENCRYPTION_KEY environment variable.',
      );
    }

    return createHash('sha256').update(secret).digest();
  }
}
