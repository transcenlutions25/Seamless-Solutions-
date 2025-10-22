"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidEmail = isValidEmail;
exports.isValidPassword = isValidPassword;
exports.sanitizeString = sanitizeString;
exports.slugify = slugify;
exports.formatDate = formatDate;
exports.parsePagination = parsePagination;
exports.createPaginatedResponse = createPaginatedResponse;
exports.delay = delay;
exports.retry = retry;
exports.createErrorResponse = createErrorResponse;
exports.createSuccessResponse = createSuccessResponse;
/**
 * Validate email format
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
/**
 * Validate password strength
 */
function isValidPassword(password) {
    if (password.length < 8) {
        return { valid: false, message: 'Password must be at least 8 characters long' };
    }
    if (!/[A-Z]/.test(password)) {
        return { valid: false, message: 'Password must contain at least one uppercase letter' };
    }
    if (!/[a-z]/.test(password)) {
        return { valid: false, message: 'Password must contain at least one lowercase letter' };
    }
    if (!/[0-9]/.test(password)) {
        return { valid: false, message: 'Password must contain at least one number' };
    }
    return { valid: true };
}
/**
 * Sanitize user input
 */
function sanitizeString(input) {
    return input.trim().replace(/[<>]/g, '');
}
/**
 * Generate slug from string
 */
function slugify(text) {
    return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}
/**
 * Format date to ISO string
 */
function formatDate(date) {
    return date.toISOString();
}
/**
 * Parse pagination parameters
 */
function parsePagination(params) {
    const page = Math.max(1, params.page || 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize || 20));
    const skip = (page - 1) * pageSize;
    return {
        page,
        pageSize,
        skip,
        take: pageSize,
        sortBy: params.sortBy || 'createdAt',
        sortOrder: params.sortOrder || 'desc',
    };
}
/**
 * Create paginated response
 */
function createPaginatedResponse(data, total, page, pageSize) {
    return {
        data,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
    };
}
/**
 * Delay execution
 */
function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
/**
 * Retry function with exponential backoff
 */
async function retry(fn, maxRetries = 3, delayMs = 1000) {
    let lastError;
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        }
        catch (error) {
            lastError = error;
            if (i < maxRetries - 1) {
                await delay(delayMs * Math.pow(2, i));
            }
        }
    }
    throw lastError;
}
/**
 * Create error response
 */
function createErrorResponse(error) {
    return {
        success: false,
        error: typeof error === 'string' ? error : error.message,
    };
}
/**
 * Create success response
 */
function createSuccessResponse(data, message) {
    return {
        success: true,
        data,
        ...(message && { message }),
    };
}
