export const uploadToCloudinary = async (file) => {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'YOUR_CLOUD_NAME';
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'YOUR_UPLOAD_PRESET';
  
  if (cloudName === 'YOUR_CLOUD_NAME' || uploadPreset === 'YOUR_UPLOAD_PRESET') {
    throw new Error('Cloudinary environment variables are missing! Please set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET in your .env.local file.');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  try {
    // /auto/upload automatically detects whether it is an image or a video
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
      method: 'POST',
      body: formData,
    });
    
    const data = await res.json();
    if (data.secure_url) {
      return data.secure_url;
    } else {
      console.error('Cloudinary Error:', data);
      throw new Error(data.error?.message || 'Failed to upload to Cloudinary');
    }
  } catch (error) {
    console.error('Upload Error:', error);
    throw new Error('Upload failed. Check your internet connection or Cloudinary settings.');
  }
};
