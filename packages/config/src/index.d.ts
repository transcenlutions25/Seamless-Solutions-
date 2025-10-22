export declare const CONSTANTS: {
    readonly JWT_EXPIRES_IN: "7d";
    readonly BCRYPT_ROUNDS: 10;
    readonly DEFAULT_PAGE_SIZE: 20;
    readonly MAX_PAGE_SIZE: 100;
    readonly RATE_LIMIT_WINDOW: number;
    readonly RATE_LIMIT_MAX_REQUESTS: 100;
    readonly CORS_ORIGINS: string[];
};
export declare const ENV: {
    readonly NODE_ENV: string;
    readonly PORT: number;
    readonly DATABASE_URL: string;
    readonly REDIS_URL: string;
    readonly JWT_SECRET: string;
    readonly API_URL: string;
    readonly WEB_URL: string;
};
export declare const isProd: boolean;
export declare const isDev: boolean;
export declare const isTest: boolean;
