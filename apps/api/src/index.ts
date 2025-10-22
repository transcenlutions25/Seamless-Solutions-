import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

interface HealthResponse {
  ok: boolean;
  timestamp: string;
}

const app: FastifyInstance = Fastify({ 
  logger: true 
});

// Health check endpoint
app.get<{ Reply: HealthResponse }>('/health', async (request: FastifyRequest, reply: FastifyReply): Promise<HealthResponse> => {
  return {
    ok: true,
    timestamp: new Date().toISOString()
  };
});

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  console.log(`Received ${signal}, shutting down gracefully`);
  try {
    await app.close();
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
const start = async (): Promise<void> => {
  try {
    const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;
    const host = process.env.HOST || '0.0.0.0';
    
    await app.listen({ port, host });
    console.log(`API running on ${host}:${port}`);
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

start();
