
import JSZip from 'jszip';
import { ImageTile } from '../types';

export const splitImage = (
  file: File,
  rows: number,
  cols: number
): Promise<ImageTile[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const tileWidth = img.width / cols;
        const tileHeight = img.height / rows;
        const tiles: ImageTile[] = [];

        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const canvas = document.createElement('canvas');
            canvas.width = tileWidth;
            canvas.height = tileHeight;
            const ctx = canvas.getContext('2d');

            if (ctx) {
              ctx.drawImage(
                img,
                c * tileWidth,
                r * tileHeight,
                tileWidth,
                tileHeight,
                0,
                0,
                tileWidth,
                tileHeight
              );
              
              tiles.push({
                id: `tile-${r}-${c}-${Date.now()}`,
                originalUrl: canvas.toDataURL('image/png'),
                isEnhancing: false,
                row: r,
                col: c,
              });
            }
          }
        }
        resolve(tiles);
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const downloadAllAsZip = async (tiles: ImageTile[]) => {
  const zip = new JSZip();
  const folder = zip.folder("split_images");

  if (!folder) return;

  tiles.forEach((tile, index) => {
    const dataUrl = tile.enhancedUrl || tile.originalUrl;
    const base64Data = dataUrl.split(',')[1];
    folder.file(`tile_${tile.row + 1}_${tile.col + 1}.png`, base64Data, { base64: true });
  });

  const content = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(content);
  const link = document.createElement('a');
  link.href = url;
  link.download = `images_collection_${Date.now()}.zip`;
  link.click();
  URL.revokeObjectURL(url);
};

export const downloadSingleImage = (url: string, filename: string) => {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
};
