import { describe, it, expect, beforeEach } from 'vitest';
import { CPFValidator } from '../CPFValidator';

describe('CPFValidator', () => {
  let validator: CPFValidator;

  beforeEach(() => {
    validator = new CPFValidator();
  });

  describe('valid CPFs', () => {
    it('should accept a formatted valid CPF', () => {
      expect(validator.validate('529.982.247-25')).toBe(true);
    });

    it('should accept an unformatted valid CPF', () => {
      expect(validator.validate('52998224725')).toBe(true);
    });

    it('should accept another valid CPF', () => {
      expect(validator.validate('111.444.777-35')).toBe(true);
    });
  });

  describe('invalid CPFs', () => {
    it('should reject a CPF with wrong check digits', () => {
      expect(validator.validate('529.982.247-00')).toBe(false);
    });

    it('should reject all-zeros CPF', () => {
      expect(validator.validate('000.000.000-00')).toBe(false);
    });

    it('should reject all-same-digits CPF', () => {
      expect(validator.validate('111.111.111-11')).toBe(false);
    });

    it('should reject a too-short CPF', () => {
      expect(validator.validate('12345')).toBe(false);
    });

    it('should reject an empty string', () => {
      expect(validator.validate('')).toBe(false);
    });

    it('should reject non-numeric characters', () => {
      expect(validator.validate('abc.def.ghi-jk')).toBe(false);
    });
  });
});
