/**
 * @file 移动端检测 Hook
 * @description 通过 window.matchMedia 监听视口宽度变化
 * 断点为 768px，用于响应式布局判断
 */

import * as React from "react"

/** 移动端断点像素值 */
const MOBILE_BREAKPOINT = 768

/** 返回当前是否为移动端视口宽度的布尔值 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}
