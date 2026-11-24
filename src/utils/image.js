// Turns a picked photo into a small JPEG data URL. Phone photos are often 5–10 MB;
// shrinking them keeps uploads fast and under the server's 3 MB picture limit,
// and the server only accepts real PNG, JPEG, WebP or GIF pictures anyway.
export function fileToImage(file, maxSize = 1600, quality = 0.85) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type?.startsWith('image/')) { reject(new Error('Please choose a picture')); return; }
    const img = new Image();
    const reader = new FileReader();
    reader.onload = ev => { img.src = ev.target.result; };
    reader.onerror = () => reject(new Error('Could not read that picture'));
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#fff'; // transparent PNGs would turn black as JPEG
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => reject(new Error('Could not read that picture. Try a JPG or PNG.'));
    reader.readAsDataURL(file);
  });
}
