/**
 * pCloud Storage Utility
 * Handles file uploads and direct public link generation via pCloud API.
 */

/**
 * Uploads a file to pCloud and returns a direct public download URL.
 * @param file The file blob to upload.
 * @param fileName Original name of the file.
 */
export async function uploadToPCloud(file: Blob, fileName: string): Promise<string> {
  const token = process.env.PCLOUD_ACCESS_TOKEN;
  const folderId = process.env.PCLOUD_FOLDER_ID || "0";

  if (!token) {
    throw new Error("PCLOUD_ACCESS_TOKEN is missing in environment variables.");
  }

  const formData = new FormData();
  formData.append("file", file, fileName);

  // 1. Upload the file to the specified folder
  const uploadRes = await fetch(`https://api.pcloud.com/uploadfile?folderid=${folderId}&access_token=${token}&nopartial=1`, {
    method: "POST",
    body: formData,
  });

  const uploadData = await uploadRes.json();
  if (uploadData.result !== 0) {
    throw new Error(`pCloud Upload Error: ${uploadData.error || "Unknown error"}`);
  }

  const fileId = uploadData.metadata[0].fileid;

  // 2. Generate a public link code for the file
  const pubLinkRes = await fetch(`https://api.pcloud.com/getfilepublink?fileid=${fileId}&access_token=${token}`);
  const pubLinkData = await pubLinkRes.json();

  if (pubLinkData.result !== 0) {
    throw new Error(`pCloud Public Link Error: ${pubLinkData.error || "Failed to generate public link"}`);
  }

  // 3. Resolve the direct download URL (suitable for <img> src)
  // pCloud direct links are constructed from the host and path provided by getpublinkdownload
  const directLinkRes = await fetch(`https://api.pcloud.com/getpublinkdownload?code=${pubLinkData.code}`);
  const directLinkData = await directLinkRes.json();

  if (directLinkData.result !== 0 || !directLinkData.hosts || !directLinkData.path) {
    // Fallback to the standard shortlink if direct link resolution fails
    return pubLinkData.link;
  }

  // Construct the direct CDN-style link: https://{host}{path}
  return `https://${directLinkData.hosts[0]}${directLinkData.path}`;
}
