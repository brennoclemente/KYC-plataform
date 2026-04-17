import { describe, it, expect, beforeEach } from 'vitest';
import { CNPJValidator } from '../CNPJValidator';

describe('CNPJValidator', () => {
  let validator: CNPJValidator;

  beforeEach(() => {
    validator = new CNPJValidator();
  });

  describe('valid CNPJs', () => {
    it('should accept a formatted valid CNPJ', () => {
      expect(validator.validate('11.222.333/0001-81')).toBe(true);
    });

    it('should accept an unformatted valid CNPJ', () => {
      expect(validator.validate('11222333000181')).toBe(true);
    });

    it('should accept another valid CNPJ', () => {
      expect(validator.validate('45.997.418/0001-53')).toBe(true);
    });
  });

  describe('invalid CNPJs', () => {
    it('should reject a CNPJ with wrong check digits', () => {
      expect(validator.validate('11.222.333/0001-00')).toBe(false);
    });

    it('should reject all-zeros CNPJ', () => {
      expect(validator.validate('00.000.000/0000-00')).toBe(false);
    });

    it('should reject all-same-digits CNPJ', () => {
      expect(validator.validate('11.111.111/1111-11')).toBe(false);
    });

    it('should reject a too-short CNPJ', () => {
      expect(validator.validate('12345')).toBe(false);
    });

    it('should reject an empty string', () => {
      expect(validator.validate('')).toBe(false);
    });

    it('should reject non-numeric characters', () => {
      expect(validator.validate('abc.def.ghi/jklm-no')).toBe(false);
    });
  });
});
