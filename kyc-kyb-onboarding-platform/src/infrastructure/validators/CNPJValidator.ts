import { ICNPJValidator } from '@/domain/services/ICNPJValidator';

export class CNPJValidator implements ICNPJValidator {
  validate(cnpj: string): boolean {
    const digits = cnpj.replace(/\D/g, '');

    if (digits.length !== 14) return false;

    // Reject sequences of all same digits
    if (/^(\d)\1+$/.test(digits)) return false;

    const calc = (weights: number[]) => {
      const sum = weights.reduce((acc, w, i) => acc + parseInt(digits[i]) * w, 0);
      const remainder = sum % 11;
      return remainder < 2 ? 0 : 11 - remainder;
    };

    const first = calc([5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
    if (first !== parseInt(digits[12])) return false;

    const second = calc([6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
    return second === parseInt(digits[13]);
  }
}
