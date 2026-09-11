import { createClient } from '@supabase/supabase-js'
import { createFileRoute } from '@tanstack/react-router'

const MAX_FILES = 10
const MAX_SIZE = 15 * 1024 * 1024
const ALLOWED = new Set(['image/jpeg','image/png','image/webp','image/gif','application/pdf'])

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120)
}

export const Route = createFileRoute('/api/public/application-files')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY
        if (!supabaseUrl || !serviceKey) {
          return Response.json({ error: 'Server misconfigured' }, { status: 500 })
        }

        const form = await request.formData()
        const reference = String(form.get('reference') || '').trim()
        if (!reference || reference.length > 40) {
          return Response.json({ error: 'Invalid reference' }, { status: 400 })
        }

        const files = form.getAll('files').filter((v): v is File => v instanceof File)
        if (!files.length) return Response.json({ success: true, files: [] })
        if (files.length > MAX_FILES) {
          return Response.json({ error: 'Too many files' }, { status: 400 })
        }

        for (const file of files) {
          if (file.size > MAX_SIZE || !ALLOWED.has(file.type)) {
            return Response.json({ error: `Invalid file: ${file.name}` }, { status: 400 })
          }
        }

        const supabase = createClient<any>(supabaseUrl, serviceKey, {
          auth: { persistSession: false, autoRefreshToken: false },
        })

        const { data: bucket } = await supabase.storage.getBucket('project-files')
        if (!bucket) {
          const { error: bucketError } = await supabase.storage.createBucket('project-files', {
            public: false,
            fileSizeLimit: MAX_SIZE,
            allowedMimeTypes: Array.from(ALLOWED),
          })
          if (bucketError) {
            console.error('Failed to create project-files bucket', bucketError)
            return Response.json({ error: 'File storage unavailable' }, { status: 500 })
          }
        }

        const uploaded: string[] = []
        for (const file of files) {
          const path = `${reference}/${crypto.randomUUID()}-${safeName(file.name)}`
          const bytes = new Uint8Array(await file.arrayBuffer())
          const { error } = await supabase.storage.from('project-files').upload(path, bytes, {
            contentType: file.type,
            upsert: false,
          })
          if (error) {
            console.error('File upload failed', error)
            return Response.json({ error: 'File upload failed' }, { status: 500 })
          }
          uploaded.push(path)
        }

        const { error: updateError } = await supabase
          .from('project_applications')
          .update({ file_names: uploaded, updated_at: new Date().toISOString() })
          .eq('reference', reference)

        if (updateError) {
          console.error('Failed to attach files', updateError)
          return Response.json({ error: 'Failed to attach files' }, { status: 500 })
        }

        return Response.json({ success: true, files: uploaded })
      },
    },
  },
})
