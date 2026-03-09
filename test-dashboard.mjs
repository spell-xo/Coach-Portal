import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🔐 Logging in...');
    await page.goto('http://localhost:3000/login');

    // Fill in login form
    await page.fill('input[name="email"]', 'dave@badbeat.com');
    await page.fill('input[name="password"]', 'Aim@2025');
    await page.click('button[type="submit"]');

    // Wait for navigation after login
    await page.waitForURL('**/teams', { timeout: 10000 });
    console.log('✓ Login successful');

    console.log('🔍 Navigating to http://localhost:3000/dashboard');
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle' });

    // Wait a moment for any redirects
    await page.waitForTimeout(2000);

    // Get the current URL
    const currentUrl = page.url();
    console.log('📍 Current URL:', currentUrl);

    // Take a screenshot
    await page.screenshot({ path: 'dashboard-screenshot.png', fullPage: true });
    console.log('📸 Screenshot saved to dashboard-screenshot.png');

    // Check if AppLayout navigation bar exists
    const appBarExists = await page.locator('header[class*="MuiAppBar"]').count();
    console.log('🔍 AppBar found:', appBarExists > 0 ? 'YES ✓' : 'NO ✗');

    // Check for the green banner
    const greenBannerExists = await page.locator('text=NEW VERSION LOADED').count();
    console.log('🔍 Green banner found:', greenBannerExists > 0 ? 'YES ✓' : 'NO ✗');

    // Check for AppLayout user avatar
    const avatarExists = await page.locator('[class*="MuiAvatar"]').count();
    console.log('🔍 User avatar found:', avatarExists > 0 ? 'YES ✓' : 'NO ✗');

    // Get page title
    const pageTitle = await page.locator('h4, h1').first().textContent();
    console.log('📄 Page heading:', pageTitle);

    // Get all visible text content
    const bodyText = await page.locator('body').textContent();
    console.log('\n📝 Page contains:');
    if (bodyText.includes('AIM Coach Portal')) console.log('  ✓ "AIM Coach Portal" text');
    if (bodyText.includes('Dashboard')) console.log('  ✓ "Dashboard" text');
    if (bodyText.includes('NEW VERSION LOADED')) console.log('  ✓ "NEW VERSION LOADED" banner');
    if (bodyText.includes('Teams')) console.log('  ✓ "Teams" menu item');

    console.log('\n✅ Test complete! Check dashboard-screenshot.png to see the actual page.');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
})();
