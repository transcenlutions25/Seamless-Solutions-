import { describe, it, expect } from 'vitest';
import { isValidEmail, isValidPassword, slugify, parsePagination } from '../index';

describe('Utils', () => {
  describe('isValidEmail', () => {
    it('should validate correct email', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
    });

    it('should reject invalid email', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
    });
  });

  describe('isValidPassword', () => {
    it('should validate strong password', () => {
      const result = isValidPassword('Test1234');
      expect(result.valid).toBe(true);
    });

    it('should reject short password', () => {
      const result = isValidPassword('Test12');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('8 characters');
    });

    it('should reject password without uppercase', () => {
      const result = isValidPassword('test1234');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('uppercase');
    });

    it('should reject password without lowercase', () => {
      const result = isValidPassword('TEST1234');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('lowercase');
    });

    it('should reject password without number', () => {
      const result = isValidPassword('TestTest');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('number');
    });
  });

  describe('slugify', () => {
    it('should convert text to slug', () => {
      expect(slugify('Hello World')).toBe('hello-world');
      expect(slugify('Test Project #1')).toBe('test-project-1');
      expect(slugify('Multiple   Spaces')).toBe('multiple-spaces');
    });
  });

  describe('parsePagination', () => {
    it('should parse pagination params with defaults', () => {
      const result = parsePagination({});
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(20);
      expect(result.skip).toBe(0);
      expect(result.take).toBe(20);
    });

    it('should parse custom pagination params', () => {
      const result = parsePagination({ page: 2, pageSize: 10 });
      expect(result.page).toBe(2);
      expect(result.pageSize).toBe(10);
      expect(result.skip).toBe(10);
      expect(result.take).toBe(10);
    });

    it('should enforce max page size', () => {
      const result = parsePagination({ pageSize: 200 });
      expect(result.pageSize).toBe(100);
    });

    it('should enforce min values', () => {
      const result = parsePagination({ page: -1, pageSize: 0 });
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(1);
    });
  });
});
