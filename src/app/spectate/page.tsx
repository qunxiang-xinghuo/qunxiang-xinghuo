// v7.0-fix7: 服务端入口，强制动态渲染确保中间件执行
export const dynamic = 'force-dynamic';

import SpectateClient from './SpectateClient';

export default function SpectatePage() {
  return <SpectateClient />;
}
