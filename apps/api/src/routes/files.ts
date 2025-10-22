import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { config } from '../config';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client if configured
const supabase = config.supabase.url && config.supabase.serviceKey
  ? createClient(config.supabase.url, config.supabase.serviceKey)
  : null;

const uploadRequestSchema = z.object({
  fileName: z.string().min(1),
  fileType: z.string().min(1),
  fileSize: z.number().min(1).max(config.upload.maxFileSize),
  category: z.enum(['qc-photos', 'documents', 'avatars']).default('documents'),
});

const generateUrlSchema = z.object({
  filePath: z.string().min(1),
  expiresIn: z.number().min(60).max(3600).default(3600), // 1 hour default
});

export async function fileRoutes(fastify: FastifyInstance) {
  // Get signed upload URL
  fastify.post('/upload-url', {
    preHandler: [fastify.authenticate],
    schema: {
      body: uploadRequestSchema,
    },
  }, async (request, reply) => {
    const { fileName, fileType, fileSize, category } = uploadRequestSchema.parse(request.body);

    // Validate file type
    if (!config.upload.allowedTypes.includes(fileType)) {
      return reply.status(400).send({
        error: 'File type not allowed',
        allowedTypes: config.upload.allowedTypes,
      });
    }

    // Validate file size
    if (fileSize > config.upload.maxFileSize) {
      return reply.status(400).send({
        error: 'File size too large',
        maxSize: config.upload.maxFileSize,
      });
    }

    try {
      if (supabase) {
        // Use Supabase Storage
        const orgId = request.user!.orgId;
        const userId = request.user!.id;
        const timestamp = Date.now();
        const fileExtension = fileName.split('.').pop();
        const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
        
        const filePath = `${orgId}/${category}/${userId}/${timestamp}-${sanitizedFileName}`;

        const { data, error } = await supabase.storage
          .from('seamless-files')
          .createSignedUploadUrl(filePath, {
            upsert: true,
          });

        if (error) {
          throw error;
        }

        reply.send({
          uploadUrl: data.signedUrl,
          filePath: filePath,
          publicUrl: `${config.supabase.url}/storage/v1/object/public/seamless-files/${filePath}`,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        });
      } else {
        // Fallback to local storage or other service
        // For demo purposes, return a mock response
        const mockPath = `uploads/${category}/${Date.now()}-${fileName}`;
        
        reply.send({
          uploadUrl: `${config.cors.origin}/api/files/upload/${mockPath}`,
          filePath: mockPath,
          publicUrl: `${config.cors.origin}/api/files/view/${mockPath}`,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        });
      }
    } catch (error) {
      fastify.log.error(error, 'Failed to generate upload URL');
      reply.status(500).send({ error: 'Failed to generate upload URL' });
    }
  });

  // Get signed view URL for private files
  fastify.post('/view-url', {
    preHandler: [fastify.authenticate],
    schema: {
      body: generateUrlSchema,
    },
  }, async (request, reply) => {
    const { filePath, expiresIn } = generateUrlSchema.parse(request.body);

    try {
      if (supabase) {
        const { data, error } = await supabase.storage
          .from('seamless-files')
          .createSignedUrl(filePath, expiresIn);

        if (error) {
          throw error;
        }

        reply.send({
          viewUrl: data.signedUrl,
          expiresAt: new Date(Date.now() + expiresIn * 1000),
        });
      } else {
        // Fallback for local storage
        reply.send({
          viewUrl: `${config.cors.origin}/api/files/view/${filePath}`,
          expiresAt: new Date(Date.now() + expiresIn * 1000),
        });
      }
    } catch (error) {
      fastify.log.error(error, 'Failed to generate view URL');
      reply.status(500).send({ error: 'Failed to generate view URL' });
    }
  });

  // Direct file upload endpoint (for when signed URLs aren't used)
  fastify.post('/upload', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      // Handle multipart file upload
      const data = await request.file();
      
      if (!data) {
        return reply.status(400).send({ error: 'No file provided' });
      }

      // Validate file type
      if (!config.upload.allowedTypes.includes(data.mimetype)) {
        return reply.status(400).send({
          error: 'File type not allowed',
          allowedTypes: config.upload.allowedTypes,
        });
      }

      // Get file buffer
      const buffer = await data.toBuffer();

      // Validate file size
      if (buffer.length > config.upload.maxFileSize) {
        return reply.status(400).send({
          error: 'File size too large',
          maxSize: config.upload.maxFileSize,
        });
      }

      if (supabase) {
        const orgId = request.user!.orgId;
        const userId = request.user!.id;
        const timestamp = Date.now();
        const fileExtension = data.filename.split('.').pop();
        const sanitizedFileName = data.filename.replace(/[^a-zA-Z0-9.-]/g, '_');
        
        const filePath = `${orgId}/uploads/${userId}/${timestamp}-${sanitizedFileName}`;

        const { data: uploadData, error } = await supabase.storage
          .from('seamless-files')
          .upload(filePath, buffer, {
            contentType: data.mimetype,
            upsert: true,
          });

        if (error) {
          throw error;
        }

        const publicUrl = `${config.supabase.url}/storage/v1/object/public/seamless-files/${filePath}`;

        reply.send({
          success: true,
          filePath: uploadData.path,
          publicUrl,
          fileName: data.filename,
          fileSize: buffer.length,
          fileType: data.mimetype,
        });
      } else {
        // Fallback - in production you'd save to local storage or another service
        const mockPath = `uploads/${timestamp}-${data.filename}`;
        
        reply.send({
          success: true,
          filePath: mockPath,
          publicUrl: `${config.cors.origin}/api/files/view/${mockPath}`,
          fileName: data.filename,
          fileSize: buffer.length,
          fileType: data.mimetype,
        });
      }
    } catch (error) {
      fastify.log.error(error, 'File upload failed');
      reply.status(500).send({ error: 'File upload failed' });
    }
  });

  // Delete file
  fastify.delete('/:filePath', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { filePath } = request.params as { filePath: string };

    // Decode the file path
    const decodedPath = decodeURIComponent(filePath);

    // Verify the file belongs to the user's organization
    const orgId = request.user!.orgId;
    if (!decodedPath.startsWith(orgId)) {
      return reply.status(403).send({ error: 'Access denied' });
    }

    try {
      if (supabase) {
        const { error } = await supabase.storage
          .from('seamless-files')
          .remove([decodedPath]);

        if (error) {
          throw error;
        }

        reply.send({ success: true, message: 'File deleted successfully' });
      } else {
        // Fallback for local storage
        reply.send({ success: true, message: 'File deleted successfully' });
      }
    } catch (error) {
      fastify.log.error(error, 'Failed to delete file');
      reply.status(500).send({ error: 'Failed to delete file' });
    }
  });

  // Get file metadata
  fastify.get('/info/:filePath', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { filePath } = request.params as { filePath: string };
    const decodedPath = decodeURIComponent(filePath);

    // Verify the file belongs to the user's organization
    const orgId = request.user!.orgId;
    if (!decodedPath.startsWith(orgId)) {
      return reply.status(403).send({ error: 'Access denied' });
    }

    try {
      if (supabase) {
        const { data, error } = await supabase.storage
          .from('seamless-files')
          .list(decodedPath.split('/').slice(0, -1).join('/'), {
            search: decodedPath.split('/').pop(),
          });

        if (error) {
          throw error;
        }

        const fileInfo = data?.[0];
        if (!fileInfo) {
          return reply.status(404).send({ error: 'File not found' });
        }

        reply.send({
          name: fileInfo.name,
          size: fileInfo.metadata?.size,
          lastModified: fileInfo.updated_at,
          contentType: fileInfo.metadata?.mimetype,
          publicUrl: `${config.supabase.url}/storage/v1/object/public/seamless-files/${decodedPath}`,
        });
      } else {
        // Fallback for local storage
        reply.send({
          name: decodedPath.split('/').pop(),
          size: 0,
          lastModified: new Date(),
          contentType: 'application/octet-stream',
          publicUrl: `${config.cors.origin}/api/files/view/${decodedPath}`,
        });
      }
    } catch (error) {
      fastify.log.error(error, 'Failed to get file info');
      reply.status(500).send({ error: 'Failed to get file info' });
    }
  });

  // List files in a directory
  fastify.get('/list', {
    preHandler: [fastify.authenticate],
    schema: {
      querystring: z.object({
        category: z.enum(['qc-photos', 'documents', 'avatars']).optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }),
    },
  }, async (request, reply) => {
    const { category, limit, offset } = request.query as any;
    const orgId = request.user!.orgId;

    try {
      if (supabase) {
        const path = category ? `${orgId}/${category}` : orgId;

        const { data, error } = await supabase.storage
          .from('seamless-files')
          .list(path, {
            limit,
            offset,
            sortBy: { column: 'updated_at', order: 'desc' },
          });

        if (error) {
          throw error;
        }

        const files = data.map(file => ({
          name: file.name,
          path: `${path}/${file.name}`,
          size: file.metadata?.size,
          lastModified: file.updated_at,
          contentType: file.metadata?.mimetype,
          publicUrl: `${config.supabase.url}/storage/v1/object/public/seamless-files/${path}/${file.name}`,
        }));

        reply.send({ files });
      } else {
        // Fallback for local storage
        reply.send({ files: [] });
      }
    } catch (error) {
      fastify.log.error(error, 'Failed to list files');
      reply.status(500).send({ error: 'Failed to list files' });
    }
  });
}