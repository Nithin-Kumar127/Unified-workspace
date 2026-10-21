import { Router, type Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { protect, type AuthRequest } from '../middleware/authMiddleware.js';
import dotenv from 'dotenv';

dotenv.config();

const router = Router({ mergeParams: true });

router.post('/', protect, async (req: AuthRequest, res: Response) => {
  try {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('Upload Error: Missing Supabase URL or Key in environment.');
      res.status(500).json({ error: 'Server configuration error: Missing Supabase credentials.' });
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { projectId } = req.params;
    const { fileName, fileData, fileType } = req.body;

    if (!fileName || !fileData) {
      res.status(400).json({ error: 'No file provided' });
      return;
    }

    // Convert base64 to Buffer
    const base64Data = fileData.replace(/^data:.*;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    const filePath = `project_${projectId}/${Date.now()}_${fileName}`;

    console.log(`📤 Attempting upload to bucket 'workspace-attachments' at path: ${filePath}`);

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('workspace-attachments')
      .upload(filePath, buffer, {
        contentType: fileType || 'application/octet-stream',
        upsert: false
      });

    if (error) {
      console.error('❌ Supabase Storage Detailed Error:', error);
      res.status(500).json({ error: error.message });
      return;
    }

    // Get Public URL
    const { data: publicUrlData } = supabase.storage
      .from('workspace-attachments')
      .getPublicUrl(data.path);

    console.log('✅ File uploaded successfully:', publicUrlData.publicUrl);

    res.json({
      name: fileName,
      url: publicUrlData.publicUrl,
      type: fileType
    });
  } catch (err: any) {
    console.error('❌ Upload route internal crash:', err);
    res.status(500).json({ error: err.message || 'Failed to upload attachment' });
  }
});

export default router;