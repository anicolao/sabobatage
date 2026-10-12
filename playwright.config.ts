import { defineConfig } from '@playwright/test';
export default defineConfig({
 testDir:'tests/e2e',fullyParallel:true,workers:2,
 use:{baseURL:'http://127.0.0.1:5194',browserName:'chromium',channel:'chrome',viewport:{width:393,height:852},reducedMotion:'reduce'},
 webServer:{command:'bun run dev',url:'http://127.0.0.1:5194',reuseExistingServer:true},
});
