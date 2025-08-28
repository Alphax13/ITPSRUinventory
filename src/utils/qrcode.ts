// src/utils/qrcode.ts
import QRCode from 'qrcode';

export const generateQRCode = async (text: string): Promise<string> => {
  try {
    const qrCodeDataURL = await QRCode.toDataURL(text, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 200
    });
    return qrCodeDataURL;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
};

export const generateMaterialQRCode = (materialCode: string): Promise<string> => {
  return generateQRCode(`MATERIAL:${materialCode}`);
};

export const generateAssetQRCode = (assetNumber: string): Promise<string> => {
  return generateQRCode(`ASSET:${assetNumber}`);
};
