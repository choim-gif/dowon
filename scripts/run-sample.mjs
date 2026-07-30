#!/usr/bin/env node
/**
 * 노션 연결 없이 샘플 글로 화면을 확인할 때 쓴다.
 *   npm run dev:sample     → http://localhost:3000/blog
 *   npm run build:sample   → out/ 폴더에 샘플 사이트 생성
 * 운영 빌드(npm run build)에는 샘플이 절대 섞이지 않는다.
 */
import { spawn } from 'node:child_process'

const mode = process.argv[2] === 'dev' ? 'dev' : 'build'
const bin = process.platform === 'win32' ? 'next.cmd' : 'next'

const child = spawn(bin, [mode], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: { ...process.env, SAMPLE_CONTENT: '1', NEXT_TELEMETRY_DISABLED: '1' },
})

child.on('exit', (code) => process.exit(code ?? 0))
