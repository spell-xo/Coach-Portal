import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🔐 Step 1: Coach logs in...');
    await page.goto('http://localhost:3000/login');
    await page.fill('input[name="email"]', 'dave@badbeat.com');
    await page.fill('input[name="password"]', 'Aim@2025');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/teams', { timeout: 10000 });
    console.log('✓ Coach logged in successfully');

    console.log('\n📋 Step 2: Checking existing teams...');
    await page.waitForSelector('text=My Teams', { timeout: 5000 });

    // Check if there are any teams
    const noTeamsText = await page.locator('text=No teams yet').count();

    if (noTeamsText > 0) {
      console.log('📝 No teams found, creating a team...');

      // Click Create Team button
      await page.click('button:has-text("Create Team")');

      // Fill in team details
      await page.fill('input[name="name"]', 'Test Team U12');
      await page.click('[name="ageGroup"]');
      await page.click('li:has-text("Under 12")');
      await page.click('button[type="submit"]');

      // Wait for team creation
      await page.waitForTimeout(2000);
      console.log('✓ Team created successfully');
    } else {
      console.log('✓ Existing teams found');
    }

    console.log('\n👥 Step 3: Opening team details...');
    // Click on first team card
    await page.click('button:has-text("View Details")');
    await page.waitForTimeout(1000);

    console.log('\n✉️  Step 4: Inviting a player...');
    await page.click('button:has-text("Invite Player")');
    await page.waitForTimeout(500);

    // Enter player email
    await page.fill('input[name="email"]', 'john.smith@player.com');
    await page.click('button:has-text("Send Invitation")');
    await page.waitForTimeout(2000);
    console.log('✓ Invitation sent to john.smith@player.com');

    console.log('\n📧 Step 5: Getting invitation token from database...');
    // We need to get the invitation token - let's check the invitations tab
    await page.click('text=Invitations');
    await page.waitForTimeout(1000);

    // Take a screenshot
    await page.screenshot({ path: 'invitation-sent.png' });
    console.log('📸 Screenshot saved: invitation-sent.png');

    console.log('\n✅ Coach flow complete!');
    console.log('\n💡 Next steps:');
    console.log('1. Check the database for the invitation token');
    console.log('2. Test player acceptance flow at http://localhost:3000/invite/{token}');
    console.log('3. Or log in as john.smith@player.com to see pending invitations');

  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.screenshot({ path: 'error-screenshot.png' });
  } finally {
    console.log('\n👋 Test complete. Browser will remain open for inspection.');
    // Don't close browser so we can inspect
    // await browser.close();
  }
})();
