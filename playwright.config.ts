import { defineConfig } from '@playwright/test';
export default defineConfig({
 testDir:'tests/e2e',fullyParallel:true,workers:2,
 use:{baseURL:process.env.SABOBATAGE_LIVE_URL||'http://127.0.0.1:5194',browserName:'chromium',channel:'chrome',viewport:{width:393,height:852},reducedMotion:'reduce'},
 webServer:process.env.SABOBATAGE_LIVE_URL?undefined:{command:'bun run dev',url:'http://127.0.0.1:5194',reuseExistingServer:true},
});
