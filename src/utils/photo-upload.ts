import { uploadData } from "aws-amplify/storage";
import { fetchAuthSession } from "aws-amplify/auth";
import imageCompression from "browser-image-compression";

const COMPRESSION_OPTIONS = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1200,
  useWebWorker: true,
};

export async function compressAndUpload(
  file: File,
  filename: string
): Promise<string> {
  const compressed = await imageCompression(file, COMPRESSION_OPTIONS);
  const session = await fetchAuthSession();
  const identityId = session.identityId!;
  const key = `photos/${identityId}/${filename}`;
  await uploadData({ path: key, data: compressed });
  return key;
}
