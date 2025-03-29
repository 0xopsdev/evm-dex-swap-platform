import type { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'
import formidable from 'formidable'
import fs from 'fs'

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const form = formidable();

  try {
    const [fields, files] = await form.parse(req);
    
    const file = files.file?.[0];
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    const fileContent = await fs.promises.readFile(file.filepath);

    const formData = new FormData();
    formData.append('file', new Blob([fileContent]), file.originalFilename || 'unnamed_file');

    const apiKey = process.env.CHAINSAFE_API_KEY;
    const bucketId = process.env.CHAINSAFE_BUCKET_ID;

    if (!apiKey || !bucketId) {
      console.error('Missing API key or bucket ID');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const response = await axios.post(
      `https://api.chainsafe.io/api/v1/bucket/${bucketId}/upload`,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'multipart/form-data',
        },
      }
    )

    if (response.data.files_details && response.data.files_details.length > 0) {
      const cid = response.data.files_details[0].cid
      const url = `https://ipfs-chainsafe.dev/ipfs/${cid}`
      res.status(200).json({ url })
    } else {
      res.status(500).json({ error: 'No CID found in the response' })
    }

  } catch (error) {
    console.error('Error uploading to IPFS:', error)
    if (axios.isAxiosError(error)) {
      console.error('Axios error details:', error.response?.data)
      res.status(error.response?.status || 500).json({ error: error.response?.data || 'Failed to upload image to IPFS' })
    } else {
      res.status(500).json({ error: 'Failed to upload image to IPFS' })
    }
  }
}