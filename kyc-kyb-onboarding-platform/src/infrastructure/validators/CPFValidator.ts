import { ICPFValidator } from '@/domain/services/ICPFValidator';

export class CPFValidator implements ICPFValidator {
  validate(cpf: string): boolean {
    const digits = cpf.replace(/\D/g, '');

    if (digits.length !== 11) return false;

    // Reject sequences of all same digits
    if (/^(\d)\1+$/.test(digits)) return false;

    const calc = (weights: number[]) => {
      const sum = weights.reduce((acc, w, i) => acc + parseInt(digits[i]) * w, 0);
      const remainder = (sum * 10) % 11;
      return remainder === 10 || remainder === 11 ? 0 : remainder;
    };

    const first = calc([10, 9, 8, 7, 6, 5, 4, 3, 2]);
    if (first !== parseInt(digits[9])) return false;

    const second = calc([11, 10, 9, 8, 7, 6, 5, 4, 3, 2]);
    return second === parseInt(digits[10]);
  }
}
