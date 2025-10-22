import { PaginationParams, PaginatedResponse } from '@seamless/types';
/**
 * Validate email format
 */
export declare function isValidEmail(email: string): boolean;
/**
 * Validate password strength
 */
export declare function isValidPassword(password: string): {
    valid: boolean;
    message?: string;
};
/**
 * Sanitize user input
 */
export declare function sanitizeString(input: string): string;
/**
 * Generate slug from string
 */
export declare function slugify(text: string): string;
/**
 * Format date to ISO string
 */
export declare function formatDate(date: Date): string;
/**
 * Parse pagination parameters
 */
export declare function parsePagination(params: PaginationParams): {
    page: number;
    pageSize: number;
    skip: number;
    take: number;
    sortBy: string;
    sortOrder: "asc" | "desc";
};
/**
 * Create paginated response
 */
export declare function createPaginatedResponse<T>(data: T[], total: number, page: number, pageSize: number): PaginatedResponse<T>;
/**
 * Delay execution
 */
export declare function delay(ms: number): Promise<void>;
/**
 * Retry function with exponential backoff
 */
export declare function retry<T>(fn: () => Promise<T>, maxRetries?: number, delayMs?: number): Promise<T>;
/**
 * Create error response
 */
export declare function createErrorResponse(error: string | Error): {
    success: boolean;
    error: string;
};
/**
 * Create success response
 */
export declare function createSuccessResponse<T>(data: T, message?: string): {
    message?: string | undefined;
    success: boolean;
    data: T;
};
