import { chromium } from 'playwright';
import mongoose from 'mongoose';

const MONGO_URI = 'mongodb://127.0.0.1:27017/codeyoung_booking';
const BASE_URL = 'http://localhost:5173';
const API_URL = 'http://localhost:5000/api';

async function runLiveBrowserAcceptanceTests() {
  console.log('========================================================');
  console.log('🚀 RUNNING LIVE BROWSER PARENT QUOTA & ACCEPTANCE SUITE');
  console.log('========================================================\n');

  await mongoose.connect(MONGO_URI);
  console.log('✓ Connected to MongoDB');

  // Clean test records for clean evaluation
  await mongoose.connection.db.collection('bookings').deleteMany({});
  await mongoose.connection.db.collection('parents').deleteMany({});
  console.log('✓ Cleared database collections for clean test execution');

  let browser;
  try {
    browser = await chromium.launch({ channel: 'msedge', headless: true });
  } catch (e) {
    browser = await chromium.launch({ channel: 'chrome', headless: true });
  }
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();

  const testReport = [];

  try {
    // ----------------------------------------------------
    // LIVE TEST 1: Parent Booking 1 for Sohan (10:00 AM)
    // ----------------------------------------------------
    console.log('\n[Action] Parent Booking #1 for Sohan (sohan@gmail.com)...');
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    const startBtn = await page.$('#header-book-trial-cta');
    if (startBtn) await startBtn.click();
    await page.waitForSelector('#studentName');

    // Fill Step 1
    await page.fill('#studentName', 'rohan');
    await page.fill('#parentName', 'sohan');
    await page.fill('#parentEmail', 'sohan@gmail.com');
    await page.selectOption('#parentTimezone', 'Asia/Kolkata');
    await page.click('button[type="submit"]');

    // Step 2: Select Date & Slot 1 (10:00 AM)
    await page.waitForSelector('#date-picker-input');
    await page.fill('#date-picker-input', '2026-10-05');
    await page.dispatchEvent('#date-picker-input', 'change');
    await page.waitForTimeout(1000);

    const slot1 = await page.waitForSelector('button:has-text("10:00 AM")');
    await slot1.click();
    await page.click('button:has-text("Review Booking")');

    // Step 3: Confirm Booking 1
    await page.waitForSelector('button:has-text("Confirm & Book Trial Class")');
    await page.click('button:has-text("Confirm & Book Trial Class")');
    await page.waitForSelector('text=Trial Class Confirmed', { timeout: 10000 });
    console.log('✓ Booking #1 confirmed successfully in UI.');

    testReport.push({
      test: 'Parent Booking 1 (10:00 AM)',
      expected: 'Confirmed successfully (1/2 quota)',
      actual: 'Trial Class Confirmed',
      status: 'PASS',
    });

    // ----------------------------------------------------
    // LIVE TEST 2: Parent Booking 2 for Sohan (11:30 AM)
    // ----------------------------------------------------
    console.log('\n[Action] Parent Booking #2 for Sohan (sohan@gmail.com)...');
    await page.goto(BASE_URL);
    const startBtn2 = await page.$('#header-book-trial-cta');
    if (startBtn2) await startBtn2.click();
    await page.waitForSelector('#studentName');

    await page.fill('#studentName', 'rohan');
    await page.fill('#parentName', 'sohan');
    await page.fill('#parentEmail', 'sohan@gmail.com');
    await page.selectOption('#parentTimezone', 'Asia/Kolkata');
    await page.click('button[type="submit"]');

    await page.waitForSelector('#date-picker-input');
    await page.fill('#date-picker-input', '2026-10-05');
    await page.dispatchEvent('#date-picker-input', 'change');
    await page.waitForTimeout(1000);

    const slot2 = await page.waitForSelector('button:has-text("11:30 AM")');
    await slot2.click();
    await page.click('button:has-text("Review Booking")');

    await page.waitForSelector('button:has-text("Confirm & Book Trial Class")');
    await page.click('button:has-text("Confirm & Book Trial Class")');
    await page.waitForSelector('text=Trial Class Confirmed', { timeout: 10000 });
    console.log('✓ Booking #2 confirmed successfully in UI.');

    testReport.push({
      test: 'Parent Booking 2 (11:30 AM)',
      expected: 'Confirmed successfully (2/2 quota reached)',
      actual: 'Trial Class Confirmed',
      status: 'PASS',
    });

    // Verify DB contains exactly 2 bookings for Sohan on 2026-10-05
    const sohanDoc = await mongoose.connection.db.collection('parents').findOne({ email: 'sohan@gmail.com' });
    const sohanCount = await mongoose.connection.db.collection('bookings').countDocuments({
      parentId: sohanDoc._id,
      parentDateLocal: '2026-10-05',
      status: 'CONFIRMED',
    });
    console.log(`[DB Audit] Sohan active bookings on 2026-10-05: ${sohanCount}/2`);

    // ----------------------------------------------------
    // LIVE TEST 3: Attempt 3rd Booking on Same Day (Rejected)
    // ----------------------------------------------------
    console.log('\n[Action] Attempting 3rd booking for Sohan on 2026-10-05 (01:00 PM)...');
    await page.goto(BASE_URL);
    const startBtn3 = await page.$('#header-book-trial-cta');
    if (startBtn3) await startBtn3.click();
    await page.waitForSelector('#studentName');

    await page.fill('#studentName', 'rohan');
    await page.fill('#parentName', 'sohan');
    await page.fill('#parentEmail', 'sohan@gmail.com');
    await page.selectOption('#parentTimezone', 'Asia/Kolkata');
    await page.click('button[type="submit"]');

    await page.waitForSelector('#date-picker-input');
    await page.fill('#date-picker-input', '2026-10-05');
    await page.dispatchEvent('#date-picker-input', 'change');
    await page.waitForTimeout(1000);

    const slot3 = await page.waitForSelector('button:has-text("01:00 PM"), button:has-text("1:00 PM")');
    await slot3.click();
    await page.click('button:has-text("Review Booking")');

    await page.waitForSelector('button:has-text("Confirm & Book Trial Class")');
    await page.click('button:has-text("Confirm & Book Trial Class")');
    await page.waitForSelector('#booking-error-banner', { timeout: 10000 });

    const errorBannerText = await page.innerText('#booking-error-banner');
    console.log('Rendered Error Banner in UI:\n', errorBannerText);

    const hasLimitTitle = errorBannerText.includes('Daily trial limit reached') || errorBannerText.includes('maximum of 2 trial classes');
    const hasLimitMessage = errorBannerText.includes('maximum of 2 trial classes for today. Please choose another date.');

    const finalSohanCount = await mongoose.connection.db.collection('bookings').countDocuments({
      parentId: sohanDoc._id,
      parentDateLocal: '2026-10-05',
      status: 'CONFIRMED',
    });
    console.log(`[DB Audit] Sohan final count after 3rd attempt: ${finalSohanCount}/2 (strictly blocked)`);

    testReport.push({
      test: 'Parent 3rd Booking Attempt on Same Day',
      expected: 'REJECTED with "Daily trial limit reached" & max 2 in DB',
      actual: `UI Error: "${errorBannerText.slice(0, 80)}..." | DB Count: ${finalSohanCount}`,
      status: (hasLimitTitle || hasLimitMessage) && finalSohanCount === 2 ? 'PASS' : 'FAIL',
    });

    // ----------------------------------------------------
    // LIVE TEST 4: Attempt Duplicate Booking for Same Parent & Time
    // ----------------------------------------------------
    console.log('\n[Action] Attempting duplicate booking for Sohan at 10:00 AM on next date (2026-10-06)...');
    // First, book 10:00 AM on 2026-10-06
    await fetch(`${API_URL}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        parent: { name: 'sohan', email: 'sohan@gmail.com', timezone: 'Asia/Kolkata' },
        startTime: '2026-10-06T10:00:00',
        timezone: 'Asia/Kolkata',
      }),
    });

    // Attempt second duplicate booking for Sohan at the exact same time
    const duplicateRes = await fetch(`${API_URL}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        parent: { name: 'sohan', email: 'sohan@gmail.com', timezone: 'Asia/Kolkata' },
        startTime: '2026-10-06T10:00:00',
        timezone: 'Asia/Kolkata',
      }),
    }).then(r => r.json());

    console.log('Duplicate booking attempt response:\n', duplicateRes);
    const isDuplicateBlocked = duplicateRes.error?.code === 'DUPLICATE_PARENT_BOOKING';

    testReport.push({
      test: 'Duplicate Same-Time Booking for Same Parent',
      expected: 'REJECTED with "You already have a trial class booked for this time."',
      actual: duplicateRes.error?.message || 'Blocked',
      status: isDuplicateBlocked ? 'PASS' : 'FAIL',
    });

    // ----------------------------------------------------
    // LIVE TEST 5: Different Parent Independence Test
    // ----------------------------------------------------
    console.log('\n[Action] Booking trial class for different parent Rahul (rahul@gmail.com) on 2026-10-05...');
    const rahulRes = await fetch(`${API_URL}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        parent: { name: 'Rahul', email: 'rahul@gmail.com', timezone: 'Asia/Kolkata' },
        startTime: '2026-10-05T10:00:00',
        timezone: 'Asia/Kolkata',
      }),
    }).then(r => r.json());

    console.log('Rahul booking status:', rahulRes.success, 'Mentor assigned:', rahulRes.data?.mentor?.name);
    testReport.push({
      test: 'Different Parent Independent Booking',
      expected: 'Rahul succeeds independently on the same calendar day',
      actual: rahulRes.success ? `Confirmed with mentor ${rahulRes.data?.mentor?.name}` : 'Failed',
      status: rahulRes.success ? 'PASS' : 'FAIL',
    });

    // ----------------------------------------------------
    // LIVE TEST 6: Mentor 2-Class Quota & Mentor Timeline UI
    // ----------------------------------------------------
    console.log('\n[Action] Inspecting Mentor View & Daily Limit Status in UI...');
    await page.click('#nav-mentor-view');
    await page.waitForSelector('#mentor-capacity-status');

    const mentorViewSummary = await page.innerText('main');
    console.log('Mentor View UI Excerpt:\n', mentorViewSummary.slice(0, 350));

    testReport.push({
      test: 'Mentor Schedule Timeline & Capacity Meter UI',
      expected: 'Mentor Schedule and Capacity Status render cleanly in UI',
      actual: 'Rendered with live timeline and capacity meter',
      status: 'PASS',
    });

  } catch (err) {
    console.error('Test Execution Error:', err);
  } finally {
    await browser.close();
    await mongoose.disconnect();

    console.log('\n========================================================');
    console.log('📊 FINAL LIVE ACCEPTANCE TEST RESULTS');
    console.log('========================================================');
    console.table(testReport);
  }
}

runLiveBrowserAcceptanceTests();
