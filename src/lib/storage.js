// src/lib/storage.js
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { app } from "./firebase";

export const storage = getStorage(app);

export async function uploadImages(images, userId) {
  const uploadPromises = images.map(async (image, index) => {
    const timestamp = Date.now();
    const filename = `posts/${userId}/${timestamp}_${index}_${image.name}`;
    const storageRef = ref(storage, filename);
    
    await uploadBytes(storageRef, image);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  });

  return await Promise.all(uploadPromises);
}
