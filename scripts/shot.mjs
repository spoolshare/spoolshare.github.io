// Visual QA helper: node scripts/shot.mjs <url-path> <out.png> [width] [dark] [actions-json]
// Uses the locally installed Google Chrome via playwright-core.
import { chromium } from 'playwright-core'
const [, , path = '/', out = 'shot.png', width = '1280', dark = '', actions = '[]'] = process.argv
const base = process.env.BASE ?? 'http://localhost:5199'
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const page = await browser.newPage({ viewport: { width: Number(width), height: 900 }, colorScheme: dark ? 'dark' : 'light', deviceScaleFactor: 1 })
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
await page.goto(base + path, { waitUntil: 'networkidle' })
for (const a of JSON.parse(actions)) {
  if (a.click) await page.click(a.click)
  if (a.fill) await page.fill(a.fill, a.value)
  if (a.wait) await page.waitForTimeout(a.wait)
  if (a.goto) await page.goto(base + a.goto, { waitUntil: 'networkidle' })
}
await page.waitForTimeout(400)
await page.screenshot({ path: out, fullPage: true })
if (errors.length) console.log('PAGE ERRORS:\n' + errors.join('\n'))
await browser.close()
