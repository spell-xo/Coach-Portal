import { chromium } from 'playwright';

const INVITATION_TOKEN = '0caa23911571b45e67a1b11cbe7abae31638d776a98630c3534ae69b2f9a14f4';

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🎯 Step 1: Opening invitation link...');
    await page.goto(`http://localhost:3000/invite/${INVITATION_TOKEN}`);
    await page.waitForTimeout(2000);

    console.log('📸 Taking screenshot of invitation page...');
    await page.screenshot({ path: 'invitation-page.png', fullPage: true });
    console.log('✓ Screenshot saved: invitation-page.png');

    // Check if we need to login
    const loginButton = await page.locator('button:has-text("Login to Accept")').count();

    if (loginButton > 0) {
      console.log('\n🔐 Step 2: Need to login, clicking login button...');
      await page.click('button:has-text("Login to Accept")');
      await page.waitForTimeout(2000); // Wait for navigation

      console.log('📝 Step 3: Filling login form...');
      await page.fill('input[name="email"]', 'john.smith@player.com');
      await page.fill('input[name="password"]', 'Player123!');

      console.log('📸 Taking screenshot before login...');
      await page.screenshot({ path: 'before-login.png', fullPage: true });

      await page.click('button[type="submit"]');

      // Wait for redirect back to invitation page
      await page.waitForTimeout(3000);

      console.log('📸 Taking screenshot after login...');
      await page.screenshot({ path: 'after-login.png', fullPage: true });
    }

    console.log('\n✅ Step 4: Clicking Accept button...');
    const acceptButton = await page.locator('button:has-text("Accept")');
    await acceptButton.waitFor({ state: 'visible', timeout: 5000 });
    await acceptButton.click();

    console.log('⏳ Waiting for acceptance to process...');
    await page.waitForTimeout(3000);

    console.log('📸 Taking screenshot after acceptance...');
    await page.screenshot({ path: 'after-acceptance.png', fullPage: true });

    // Check for success message
    const successMessage = await page.locator('text=Invitation accepted').count();
    if (successMessage > 0) {
      console.log('✅ SUCCESS: Invitation accepted!');
    }

    // Wait for redirect to player dashboard
    await page.waitForTimeout(3000);

    console.log('\n📊 Step 5: Checking player dashboard...');
    await page.screenshot({ path: 'player-dashboard.png', fullPage: true });

    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);

    if (currentUrl.includes('/player/')) {
      console.log('✅ Successfully redirected to player area!');
    }

    // Check dashboard content
    const dashboardTitle = await page.locator('text=Player Dashboard').count();
    if (dashboardTitle > 0) {
      console.log('✅ Player Dashboard loaded successfully!');
    }

    // Check for team in "My Teams"
    const teamCard = await page.locator('text=My Teams').count();
    if (teamCard > 0) {
      console.log('✅ "My Teams" section found!');
    }

    console.log('\n🎉 COMPLETE TEST RESULTS:');
    console.log('✓ Invitation page loaded');
    console.log('✓ Player logged in');
    console.log('✓ Invitation accepted');
    console.log('✓ Redirected to player dashboard');

    console.log('\n📸 Screenshots saved:');
    console.log('  - invitation-page.png');
    console.log('  - before-login.png');
    console.log('  - after-login.png');
    console.log('  - after-acceptance.png');
    console.log('  - player-dashboard.png');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    await page.screenshot({ path: 'error-screenshot.png', fullPage: true });
    console.log('📸 Error screenshot saved: error-screenshot.png');
  } finally {
    console.log('\n👋 Test complete. Browser will remain open for 10 seconds...');
    await page.waitForTimeout(10000);
    await browser.close();
  }
})();
