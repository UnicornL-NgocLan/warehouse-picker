import app from 'axiosConfig';

export async function getDropBoxAccessToken(): Promise<string | null> {
  try {
    const { data } = await app.get('/api/get-dropbox-access-token');
    return data?.data || null;
  } catch (error) {
    console.error('Lỗi lấy access token Dropbox:', error);
    return null;
  }
}

function generateFileName(dataUrl: string): string {
  const mime = dataUrl.match(/^data:(.*?);base64,/);
  const ext = mime?.[1]?.split('/')[1] || 'jpg';
  return `${Date.now()}-${Math.random().toString(36).substring(2, 10)}.${ext}`;
}

export async function uploadBase64ToDropBox(dataUrl: string, accessToken: string): Promise<any> {
  const base64Data = dataUrl.split(',')[1];
  const fileName = generateFileName(dataUrl);

  const binaryString = window.atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const buffer = bytes.buffer;

  const response = await fetch('https://content.dropboxapi.com/2/files/upload', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/octet-stream',
      'Dropbox-API-Arg': JSON.stringify({
        path: `/images/${fileName}`,
        mode: 'add',
        autorename: true,
      }),
    },
    body: buffer,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Dropbox upload error (${response.status}): ${errText}`);
  }

  return await response.json();
}

export async function createSharedLink(filePath: string, accessToken: string): Promise<string | null> {
  try {
    const response = await fetch('https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path: filePath,
        settings: {
          requested_visibility: 'public',
        },
      }),
    });

    const resData = await response.json();
    if (resData.url) {
      return resData.url.replace('dl=0', 'raw=1');
    }

    if (resData?.error?.['.tag'] === 'shared_link_already_exists') {
      const listRes = await fetch('https://api.dropboxapi.com/2/sharing/list_shared_links', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ path: filePath, direct_only: true }),
      });
      const listData = await listRes.json();
      if (listData?.links && listData.links.length > 0 && listData.links[0].url) {
        return listData.links[0].url.replace('dl=0', 'raw=1');
      }
    }

    return null;
  } catch (err) {
    console.error('Lỗi tạo shared link Dropbox:', err);
    return null;
  }
}

export async function uploadMultipleImagesToDropBox(
  dataUrls: string[],
  onProgress?: (current: number, total: number) => void
): Promise<string[]> {
  if (!dataUrls || dataUrls.length === 0) return [];

  const token = await getDropBoxAccessToken();
  if (!token) {
    throw new Error('Không lấy được access token của Dropbox. Vui lòng kiểm tra cấu hình DROPBOX trong file server/.env');
  }

  const directUrls: string[] = [];
  for (let i = 0; i < dataUrls.length; i++) {
    if (onProgress) {
      onProgress(i + 1, dataUrls.length);
    }
    const uploaded = await uploadBase64ToDropBox(dataUrls[i], token);
    if (uploaded && uploaded.path_display) {
      const sharedUrl = await createSharedLink(uploaded.path_display, token);
      if (sharedUrl) {
        directUrls.push(sharedUrl);
      }
    }
  }

  return directUrls;
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const maxWidth = 1600;
        const maxHeight = 1600;
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        } else {
          resolve(result);
        }
      };
      img.onerror = () => resolve(result);
      img.src = result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

