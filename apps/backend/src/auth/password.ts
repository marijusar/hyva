import bcrypt from "bcryptjs";

export class Password {
  private static readonly SALT_ROUNDS = 12;

  static hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, Password.SALT_ROUNDS);
  }

  static verify(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }
}
