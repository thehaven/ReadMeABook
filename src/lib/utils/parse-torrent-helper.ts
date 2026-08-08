/**
 * Utility for parsing torrent files using parse-torrent ESM module dynamically.
 * Prevents ERR_PACKAGE_PATH_NOT_EXPORTED in Node.js CJS runtimes.
 */
export async function parseTorrent(torrent: any): Promise<any> {
  const parseTorrentModule = await import('parse-torrent');
  const parseFn = (parseTorrentModule as any).default || parseTorrentModule;
  return parseFn(torrent);
}
