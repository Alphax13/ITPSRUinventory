import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ปิดการใช้งาน Turbopack ใน production build เพื่อความเสถียร
  experimental: {
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'imgur.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.imgur.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'drive.google.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'example.com',
        port: '',
        pathname: '/**',
      }
    ],
    // เพิ่มการรองรับ unoptimized สำหรับ URL ที่ไม่สามารถ optimize ได้
    unoptimized: false,
  },
  // เพิ่มการตั้งค่าเพื่อรองรับ Vercel deployment
  typescript: {
    // อนุญาตให้ build สำเร็จแม้จะมี TypeScript errors
    ignoreBuildErrors: false,
  },
  eslint: {
    // อนุญาตให้ build สำเร็จแม้จะมี ESLint errors
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
