/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  transformIgnorePatterns: [
    '/node_modules/(?!uuid)', // 👈 让 Jest 转换 uuid 模块
  ],
};

