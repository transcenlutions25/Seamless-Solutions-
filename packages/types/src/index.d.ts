export interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    createdAt: Date;
    updatedAt: Date;
}
export declare enum UserRole {
    ADMIN = "ADMIN",
    USER = "USER",
    GUEST = "GUEST"
}
export interface CreateUserDTO {
    email: string;
    password: string;
    name: string;
}
export interface UpdateUserDTO {
    email?: string;
    name?: string;
    role?: UserRole;
}
export interface LoginDTO {
    email: string;
    password: string;
}
export interface AuthResponse {
    user: Omit<User, 'password'>;
    token: string;
}
export interface Project {
    id: string;
    name: string;
    description: string;
    status: ProjectStatus;
    ownerId: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare enum ProjectStatus {
    PLANNING = "PLANNING",
    IN_PROGRESS = "IN_PROGRESS",
    COMPLETED = "COMPLETED",
    ARCHIVED = "ARCHIVED"
}
export interface CreateProjectDTO {
    name: string;
    description: string;
}
export interface UpdateProjectDTO {
    name?: string;
    description?: string;
    status?: ProjectStatus;
}
export interface Task {
    id: string;
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    projectId: string;
    assigneeId?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare enum TaskStatus {
    TODO = "TODO",
    IN_PROGRESS = "IN_PROGRESS",
    REVIEW = "REVIEW",
    DONE = "DONE"
}
export declare enum TaskPriority {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
    URGENT = "URGENT"
}
export interface CreateTaskDTO {
    title: string;
    description: string;
    projectId: string;
    priority?: TaskPriority;
}
export interface UpdateTaskDTO {
    title?: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    assigneeId?: string;
}
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}
export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}
export interface PaginationParams {
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
