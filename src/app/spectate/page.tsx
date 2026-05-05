// v7.0-fix7: 服务端入口，强制动态渲染确保中间件执行
// 使用 headers() 确保 Next.js 无法在构建时静态生成此页面
export const dynamic = 'force-dynamic';

import { headers } from 'next/headers';
import SpectateClient from './SpectateClient';

export default function SpectatePage() {
  // 强制动态渲染：headers() 只能在请求时调用
  headers();
  return <SpectateClient />;
}
