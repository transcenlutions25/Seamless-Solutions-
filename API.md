# API Documentation

Complete API reference for Seamless Solutions.

## Base URL

- Development: `http://localhost:4000`
- Production: `https://api.yourdomain.com`

## Authentication

Most endpoints require authentication using JWT tokens.

### Headers

```
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

## Response Format

All endpoints return JSON in this format:

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message"
}
```

### Paginated Response
```json
{
  "success": true,
  "data": {
    "data": [...],
    "total": 100,
    "page": 1,
    "pageSize": 20,
    "totalPages": 5
  }
}
```

## Endpoints

### Health Check

#### GET /health

Check API health status.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 12345.67
}
```

---

## Authentication Endpoints

### Register User

#### POST /api/auth/register

Create a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "name": "John Doe"
}
```

**Validation:**
- `email`: Valid email format
- `password`: Min 8 characters, must contain uppercase, lowercase, and number
- `name`: Min 2 characters

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "USER",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "jwt-token-here"
  },
  "message": "User registered successfully"
}
```

**Error Responses:**
- `400`: Validation error
- `409`: User already exists

---

### Login

#### POST /api/auth/login

Authenticate and receive JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "USER",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "jwt-token-here"
  },
  "message": "Login successful"
}
```

**Error Responses:**
- `401`: Invalid credentials

---

### Get Current User

#### GET /api/auth/me

Get authenticated user information.

**Headers:** Requires authentication

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "USER",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
- `401`: Authentication required
- `404`: User not found

---

### Refresh Token

#### POST /api/auth/refresh

Refresh JWT token.

**Headers:** Requires authentication

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "token": "new-jwt-token-here"
  },
  "message": "Token refreshed"
}
```

---

## Project Endpoints

### List Projects

#### GET /api/projects

Get all projects for authenticated user (as owner or member).

**Headers:** Requires authentication

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `pageSize` (optional): Items per page (default: 20, max: 100)
- `sortBy` (optional): Field to sort by (default: createdAt)
- `sortOrder` (optional): asc or desc (default: desc)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "uuid",
        "name": "Project Name",
        "description": "Project description",
        "status": "IN_PROGRESS",
        "ownerId": "uuid",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z",
        "owner": {
          "id": "uuid",
          "name": "John Doe",
          "email": "john@example.com"
        },
        "_count": {
          "tasks": 5,
          "members": 3
        }
      }
    ],
    "total": 10,
    "page": 1,
    "pageSize": 20,
    "totalPages": 1
  }
}
```

---

### Get Project

#### GET /api/projects/:id

Get detailed project information.

**Headers:** Requires authentication

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Project Name",
    "description": "Project description",
    "status": "IN_PROGRESS",
    "ownerId": "uuid",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "owner": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "tasks": [...],
    "members": [...]
  }
}
```

**Error Responses:**
- `403`: Access denied
- `404`: Project not found

---

### Create Project

#### POST /api/projects

Create a new project.

**Headers:** Requires authentication

**Request Body:**
```json
{
  "name": "New Project",
  "description": "Project description"
}
```

**Validation:**
- `name`: 3-100 characters
- `description`: Max 500 characters

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "New Project",
    "description": "Project description",
    "status": "PLANNING",
    "ownerId": "uuid",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "owner": {...}
  },
  "message": "Project created successfully"
}
```

---

### Update Project

#### PATCH /api/projects/:id

Update project details (owner only).

**Headers:** Requires authentication

**Request Body:**
```json
{
  "name": "Updated Name",
  "description": "Updated description",
  "status": "COMPLETED"
}
```

**Status values:**
- `PLANNING`
- `IN_PROGRESS`
- `COMPLETED`
- `ARCHIVED`

**Success Response (200):**
```json
{
  "success": true,
  "data": {...},
  "message": "Project updated successfully"
}
```

**Error Responses:**
- `403`: Only project owner can update
- `404`: Project not found

---

### Delete Project

#### DELETE /api/projects/:id

Delete a project (owner only).

**Headers:** Requires authentication

**Success Response (200):**
```json
{
  "success": true,
  "data": null,
  "message": "Project deleted successfully"
}
```

**Error Responses:**
- `403`: Only project owner can delete
- `404`: Project not found

---

## Task Endpoints

### List Tasks

#### GET /api/tasks

Get all tasks for authenticated user.

**Headers:** Requires authentication

**Query Parameters:**
- `page`, `pageSize`, `sortBy`, `sortOrder` (same as projects)
- `projectId` (optional): Filter by project

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "uuid",
        "title": "Task Title",
        "description": "Task description",
        "status": "TODO",
        "priority": "HIGH",
        "projectId": "uuid",
        "assigneeId": "uuid",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z",
        "project": {
          "id": "uuid",
          "name": "Project Name"
        },
        "assignee": {
          "id": "uuid",
          "name": "John Doe",
          "email": "john@example.com"
        }
      }
    ],
    "total": 25,
    "page": 1,
    "pageSize": 20,
    "totalPages": 2
  }
}
```

---

### Get Task

#### GET /api/tasks/:id

Get detailed task information.

**Headers:** Requires authentication

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Task Title",
    "description": "Task description",
    "status": "IN_PROGRESS",
    "priority": "HIGH",
    "projectId": "uuid",
    "assigneeId": "uuid",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "project": {...},
    "assignee": {...}
  }
}
```

**Error Responses:**
- `403`: Access denied
- `404`: Task not found

---

### Create Task

#### POST /api/tasks

Create a new task.

**Headers:** Requires authentication

**Request Body:**
```json
{
  "title": "New Task",
  "description": "Task description",
  "projectId": "uuid",
  "priority": "MEDIUM"
}
```

**Validation:**
- `title`: 3-200 characters
- `description`: Max 1000 characters
- `projectId`: Valid UUID, must have access to project
- `priority`: LOW, MEDIUM, HIGH, or URGENT (optional, default: MEDIUM)

**Success Response (201):**
```json
{
  "success": true,
  "data": {...},
  "message": "Task created successfully"
}
```

---

### Update Task

#### PATCH /api/tasks/:id

Update task details.

**Headers:** Requires authentication

**Request Body:**
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "status": "DONE",
  "priority": "LOW",
  "assigneeId": "uuid"
}
```

**Status values:**
- `TODO`
- `IN_PROGRESS`
- `REVIEW`
- `DONE`

**Priority values:**
- `LOW`
- `MEDIUM`
- `HIGH`
- `URGENT`

**Success Response (200):**
```json
{
  "success": true,
  "data": {...},
  "message": "Task updated successfully"
}
```

---

### Delete Task

#### DELETE /api/tasks/:id

Delete a task (project owner only).

**Headers:** Requires authentication

**Success Response (200):**
```json
{
  "success": true,
  "data": null,
  "message": "Task deleted successfully"
}
```

---

## User Endpoints

### List Users

#### GET /api/users

Get all users (admin only).

**Headers:** Requires authentication + admin role

**Query Parameters:** Same as other list endpoints

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "data": [...],
    "total": 50,
    "page": 1,
    "pageSize": 20,
    "totalPages": 3
  }
}
```

---

### Get User

#### GET /api/users/:id

Get user details.

**Headers:** Requires authentication

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "USER",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "_count": {
      "projects": 5,
      "assignedTasks": 10
    }
  }
}
```

---

### Update User

#### PATCH /api/users/:id

Update user details (own profile or admin).

**Headers:** Requires authentication

**Request Body:**
```json
{
  "name": "Updated Name",
  "email": "newemail@example.com",
  "role": "ADMIN"
}
```

Note: Only admins can change roles.

**Success Response (200):**
```json
{
  "success": true,
  "data": {...},
  "message": "User updated successfully"
}
```

---

### Delete User

#### DELETE /api/users/:id

Delete a user (admin only).

**Headers:** Requires authentication + admin role

**Success Response (200):**
```json
{
  "success": true,
  "data": null,
  "message": "User deleted successfully"
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Validation error |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Resource already exists |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |

## Rate Limiting

- **Limit:** 100 requests per 15 minutes per IP
- **Headers:** Rate limit info in response headers

## Best Practices

1. **Always include auth token** for protected endpoints
2. **Handle errors gracefully** in your client
3. **Use pagination** for list endpoints
4. **Cache responses** when appropriate
5. **Respect rate limits**

## SDK Examples

### JavaScript/TypeScript

```typescript
const API_URL = 'http://localhost:4000';
const token = 'your-jwt-token';

// Login
const login = async (email: string, password: string) => {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return response.json();
};

// Get projects
const getProjects = async () => {
  const response = await fetch(`${API_URL}/api/projects`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  return response.json();
};

// Create task
const createTask = async (data) => {
  const response = await fetch(`${API_URL}/api/tasks`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return response.json();
};
```

---

For more examples and support, see the main [README.md](./README.md).
