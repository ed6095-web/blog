// src/lib/cloudinary.js
export async function uploadImagesToCloudinary(images) {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  console.log("dowtiuicx:", cloudName);
  console.log("Upload Preset:", uploadPreset);

  if (!cloudName || !uploadPreset) {
    throw new Error("Cloudinary configuration missing in .env.local");
  }

  const uploadPromises = images.map(async (image, index) => {
    const formData = new FormData();
    formData.append("file", image);
    formData.append("upload_preset", uploadPreset);
    formData.append("folder", "blog-posts");

    console.log(`Uploading image ${index + 1}...`);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await response.json();
    console.log("Upload response:", data);

    if (!response.ok) {
      console.error("Upload error:", data);
      throw new Error(`Failed to upload image: ${data.error?.message || 'Unknown error'}`);
    }

    return data.secure_url;
  });

  return await Promise.all(uploadPromises);
}
