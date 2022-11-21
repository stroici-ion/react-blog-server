export default function getExtension(filename) {
  const parts = filename.split('.');
  return parts[parts.length - 1];
}
