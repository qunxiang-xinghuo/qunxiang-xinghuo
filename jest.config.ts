/**
 * Jest 测试配置
 * 用于单元测试和集成测试
 */

import type { Config } from 'jest';

const config: Config = {
  // 使用 ts-jest 预设，支持 TypeScript
  preset: 'ts-jest',
  // 测试环境：Node.js
  testEnvironment: 'node',
  // 测试文件根目录
  roots: ['<rootDir>/src'],
  // 测试文件匹配模式
  testMatch: ['**/__tests__/**/*.test.ts'],
  // 模块文件扩展名
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  // 模块路径映射（支持 @/ 别名）
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  // 转换器配置
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
    }],
  },
};

export default config;
