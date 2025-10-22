import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import crypto from 'crypto';

export default async function filesRoutes(app: FastifyInstance) {
  // Stub signed URL generation using random keys (replace with Supabase/S3 SDK in prod)
  app.post('/files/sign-upload', async (request) => {
    const orgId = request.orgId!;
    const body = z
      .object({
        contentType: z.string().optional(),
        size: z.number().int().positive().optional(),
        path: z.string().optional(),
      })
      .parse(request.body);

    const storageKey = `${orgId}/${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
    const url = `https://example-storage/${storageKey}`;
    const uploadUrl = `${url}?signature=${crypto.randomBytes(12).toString('hex')}`;

    return { storageKey, uploadUrl, url, contentType: body.contentType ?? 'application/octet-stream' };
  });

  app.get('/files/preview/:storageKey', async (request) => {
    const params = z.object({ storageKey: z.string() }).parse(request.params);
    // In prod, validate org ownership and generate short-lived signed URL
    return { url: `https://example-storage/${params.storageKey}` };
  });
}
