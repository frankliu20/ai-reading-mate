import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    // weread CDNs — allow remote covers
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.weread.qq.com' },
      { protocol: 'https', hostname: 'wfqqreader-1252317822.image.myqcloud.com' },
      { protocol: 'https', hostname: 'thirdwx.qlogo.cn' },
      { protocol: 'https', hostname: 'rescdn.qqmail.com' },
    ],
  },
};

export default nextConfig;
