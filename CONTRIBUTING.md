# Contributing to Seamless Solutions

Thank you for your interest in contributing to Seamless Solutions! This document provides guidelines and instructions for contributing.

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- Help maintain a positive community

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/seamless-solutions.git`
3. Install dependencies: `pnpm install`
4. Create a branch: `git checkout -b feature/your-feature-name`

## Development Workflow

### 1. Set Up Development Environment

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# Start database (using Docker)
docker-compose -f infra/docker-compose.yml up db redis

# Run migrations
cd apps/api
pnpm exec prisma migrate dev
cd ../..

# Build shared packages
pnpm build:packages

# Start development servers
pnpm --filter @seamless/api dev  # In one terminal
pnpm --filter @seamless/web dev  # In another terminal
```

### 2. Making Changes

- Write clean, readable code
- Follow existing code style
- Add comments for complex logic
- Update tests for your changes
- Update documentation if needed

### 3. Code Style

We use ESLint and Prettier for code formatting:

```bash
# Lint code
pnpm lint

# Format code
pnpm format

# Check formatting
pnpm format:check
```

### 4. Testing

```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run tests in watch mode
pnpm --filter @seamless/api test --watch
```

### 5. Commit Messages

We follow conventional commits:

```
feat: add user profile page
fix: resolve login redirect issue
docs: update deployment guide
style: format code with prettier
refactor: simplify auth logic
test: add user registration tests
chore: update dependencies
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

### 6. Pull Request Process

1. **Update your branch**
   ```bash
   git checkout main
   git pull upstream main
   git checkout your-feature-branch
   git rebase main
   ```

2. **Push your changes**
   ```bash
   git push origin your-feature-branch
   ```

3. **Create Pull Request**
   - Go to GitHub
   - Click "New Pull Request"
   - Select your branch
   - Fill out the PR template
   - Request reviews

4. **PR Requirements**
   - [ ] Tests pass
   - [ ] Linting passes
   - [ ] Code is formatted
   - [ ] Documentation updated
   - [ ] Commit messages follow convention
   - [ ] PR description is clear

## Project Structure

```
seamless-solutions/
├── apps/
│   ├── api/          # Backend API
│   └── web/          # Frontend web app
├── packages/
│   ├── types/        # Shared types
│   ├── config/       # Shared config
│   └── utils/        # Shared utilities
├── infra/            # Infrastructure configs
└── .github/          # CI/CD workflows
```

## Adding New Features

### API Endpoints

1. Create route file in `apps/api/src/routes/`
2. Add validation with Zod
3. Implement business logic
4. Add tests in `__tests__/` directory
5. Update API documentation in README

Example:
```typescript
// apps/api/src/routes/example.ts
import { FastifyInstance } from 'fastify';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(3),
});

export default async function routes(fastify: FastifyInstance) {
  fastify.post('/api/example', async (request, reply) => {
    const data = schema.parse(request.body);
    // Implementation
    return { success: true, data };
  });
}
```

### Web Pages

1. Create page in `apps/web/app/`
2. Add components in `apps/web/components/`
3. Update navigation if needed
4. Add proper TypeScript types
5. Ensure responsive design

Example:
```tsx
// apps/web/app/example/page.tsx
export default function ExamplePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Your content */}
    </div>
  );
}
```

### Shared Packages

1. Add to appropriate package (`types`, `config`, or `utils`)
2. Export from package's `index.ts`
3. Rebuild package: `pnpm --filter @seamless/package-name build`
4. Add tests in `src/__tests__/`

## Database Changes

### Creating Migrations

```bash
cd apps/api

# Create migration
pnpm exec prisma migrate dev --name description_of_change

# This will:
# 1. Update schema.prisma
# 2. Generate migration SQL
# 3. Apply migration
# 4. Regenerate Prisma Client
```

### Best Practices

- Always create migrations for schema changes
- Test migrations in development first
- Never edit migration files manually
- Include rollback plan for production

## Testing Guidelines

### Unit Tests

```typescript
import { describe, it, expect } from 'vitest';

describe('Feature Name', () => {
  it('should do something', () => {
    expect(true).toBe(true);
  });
});
```

### Integration Tests

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify from 'fastify';

describe('API Endpoint', () => {
  const app = Fastify();

  beforeAll(async () => {
    // Setup
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return success', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/test',
    });
    expect(response.statusCode).toBe(200);
  });
});
```

## Documentation

When adding features:

1. Update README.md with new functionality
2. Add comments for complex code
3. Update API documentation
4. Add examples if applicable

## Review Process

1. **Automated Checks**
   - CI must pass
   - Tests must pass
   - Linting must pass

2. **Code Review**
   - At least one approval required
   - Address all comments
   - Keep discussions professional

3. **Merge**
   - Squash and merge preferred
   - Delete branch after merge

## Common Tasks

### Adding a Dependency

```bash
# API dependency
pnpm --filter @seamless/api add package-name

# Web dependency
pnpm --filter @seamless/web add package-name

# Dev dependency
pnpm add -D package-name -w
```

### Updating Dependencies

```bash
# Check for updates
pnpm outdated

# Update all
pnpm update --latest

# Update specific package
pnpm update package-name --latest
```

### Running Specific Scripts

```bash
# Run script in specific package
pnpm --filter @seamless/api <script-name>

# Run script in all packages
pnpm -r <script-name>
```

## Reporting Bugs

Use GitHub Issues with this information:

- Bug description
- Steps to reproduce
- Expected behavior
- Actual behavior
- Environment (OS, Node version, etc.)
- Screenshots if applicable

## Feature Requests

Use GitHub Issues and include:

- Feature description
- Use case
- Proposed solution
- Alternatives considered

## Questions?

- Open a GitHub Discussion
- Check existing documentation
- Ask in pull request comments

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Seamless Solutions! 🚀
