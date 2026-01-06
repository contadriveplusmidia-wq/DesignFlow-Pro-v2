/**
 * Converte uma imagem para formato WebP usando canvas
 * @param imageDataUrl - Data URL da imagem (base64)
 * @param quality - Qualidade da compressão (0-1), padrão 0.9
 * @returns Promise com a imagem convertida em formato WebP (base64)
 */
export const convertImageToWebP = async (
  imageDataUrl: string,
  quality: number = 0.9
): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Não foi possível obter contexto do canvas'));
          return;
        }
        
        // Desenhar a imagem no canvas
        ctx.drawImage(img, 0, 0);
        
        // Converter para WebP
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Erro ao converter imagem para WebP'));
              return;
            }
            
            const reader = new FileReader();
            reader.onloadend = () => {
              resolve(reader.result as string);
            };
            reader.onerror = () => {
              reject(new Error('Erro ao ler o blob'));
            };
            reader.readAsDataURL(blob);
          },
          'image/webp',
          quality
        );
      };
      
      img.onerror = () => {
        reject(new Error('Erro ao carregar a imagem'));
      };
      
      img.src = imageDataUrl;
    } catch (error: any) {
      reject(error);
    }
  });
};




