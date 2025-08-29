// src/lib/cloudinary.ts
export type { UploadApiResponse, UploadApiErrorResponse } from "cloudinary";

export async function getCloudinary() {
  const { v2: cloudinary } = await import("cloudinary");
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;

  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    throw new Error("Cloudinary env missing");
  }

  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true,
  });

  return cloudinary;
}

export async function uploadBufferToCloudinary(
  buffer: Buffer,
  folder: string,
  publicId: string
) {
  const cloudinary = await getCloudinary();
  return await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, public_id: publicId, resource_type: "image", overwrite: false },
      (err, res) => (err || !res ? reject(err) : resolve(res))
    );
    stream.end(buffer);
  });
}
