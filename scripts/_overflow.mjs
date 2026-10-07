import { chromium } from 'playwright-core'
const b = await chromium.launch({ channel: 'chrome' })
const p = await b.newPage({ viewport: { width: 390, height: 900 } })
await p.goto('http://localhost:5199/?backend=mock', { waitUntil: 'networkidle' })
await p.waitForTimeout(500)
console.log(await p.evaluate(() => document.documentElement.scrollWidth))
await p.screenshot({ path: process.argv[2] })
await b.close()
