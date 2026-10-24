import {defineConfig,devices} from '@playwright/test';
export default defineConfig({
 testDir:'./discovery-specs',timeout:30000,expect:{timeout:5000},fullyParallel:true,workers:2,retries:0,
 forbidOnly:!!process.env.CI,reporter:[['list']],outputDir:'../test-results/discovery',
 use:{baseURL:'http://127.0.0.1:4313',...(process.env.QA_BROWSER_CHANNEL?{channel:process.env.QA_BROWSER_CHANNEL}:{}),trace:'retain-on-failure',screenshot:'only-on-failure'},
 projects:[{name:'desktop',use:{...devices['Desktop Chrome'],viewport:{width:1280,height:900}}},{name:'mobile',use:{...devices['Pixel 7'],viewport:{width:390,height:844}}},{name:'narrow',use:{...devices['Desktop Chrome'],viewport:{width:320,height:568}}}],
 webServer:{command:'node e2e/support/discovery-server.mjs 4313',cwd:'..',url:'http://127.0.0.1:4313',reuseExistingServer:!process.env.CI},
});
