// Convert a multer memory-storage file to a base64 data URL
exports.toDataUrl = (file) => {
  const base64 = file.buffer.toString('base64');
  return `data:${file.mimetype};base64,${base64}`;
};

// Send a base64 data URL as a file download
exports.sendDataUrl = (res, dataUrl, fileName) => {
  const [meta, base64] = dataUrl.split(',');
  const mimeType = meta.match(/:(.*?);/)?.[1] || 'application/octet-stream';
  const buffer = Buffer.from(base64, 'base64');
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
  res.setHeader('Content-Type', mimeType);
  res.setHeader('Content-Length', buffer.length);
  res.send(buffer);
};
