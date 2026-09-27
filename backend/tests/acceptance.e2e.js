import { chromium } from 'playwright';
import mongoose from 'mongoose';

const MONGO_URI = 'mongodb://127.0.0.1:27017/codeyoung_booking';
const BASE_URL = 'http://localhost:5173';
const API_URL = 'http://localhost:5000/api';

async function runAllTests() {
  console.log('========================================================');
  console.log('STARTING LIVE END-TO-END ACCEPTANCE TESTS');
  console.log('========================================================\n');

  // Connect to MongoDB
  await mongoose.connect(MONGO_URI);
  console.log('✓ Connected to MongoDB');

  // Clean bookings & parents collection for pristine test isolation
  await mongoose.connection.db.collection('bookings').deleteMany({});
  await mongoose.connection.db.collection('parents').deleteMany({});
  console.log('✓ Cleared previous test bookings & parents');

  let browser;
  try {
    browser = await chromium.launch({ channel: 'msedge', headless: true });
  } catch (e) {
    browser = await chromium.launch({ channel: 'chrome', headless: true });
  }
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();

  const results = {};

  try {
    // ----------------------------------------------------
    // TEST 1 — CROSS-BORDER TIMEZONE SHIFT & TRANSLATION
    // ----------------------------------------------------
    console.log('--------------------------------------------------------');
    console.log('TEST 1: Cross-Border Timezone Shift & Translation');
    console.log('--------------------------------------------------------');

    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // 1. Click "Book a FREE Trial Class" on landing hero
    const bookButtons = await page.$$('button:has-text("Book a FREE Trial Class"), button:has-text("Start Booking")');
    if (bookButtons.length > 0) {
      await bookButtons[0].click();
    }
    await page.waitForSelector('#studentName');

    // 2. Fill Parent Details (Step 1)
    await page.fill('#studentName', 'Alex Miller');
    await page.fill('#parentName', 'David Miller');
    await page.fill('#parentEmail', 'david.miller@example.com');
    await page.selectOption('#parentTimezone', 'America/New_York');

    // Click "Choose Date & Time"
    await page.click('button[type="submit"]');
    await page.waitForSelector('#date-picker-input');

    // 3. Step 2: Date & Slot Selection
    // Select 2026-10-05 (Observing EDT, UTC-4)
    await page.fill('#date-picker-input', '2026-10-05');
    await page.dispatchEvent('#date-picker-input', 'change');
    await page.waitForTimeout(1000);

    // Look for 03:00 PM slot
    const slot3pm = await page.waitForSelector('button:has-text("03:00 PM")');
    await slot3pm.click();

    // Verify slot display text
    const selectedSlotText = await page.innerText('button:has-text("03:00 PM")');
    console.log('Selected Slot Card Text:\n', selectedSlotText);

    // Click "Review Booking"
    await page.click('button:has-text("Review Booking")');
    await page.waitForSelector('button:has-text("Confirm & Book Trial Class")');

    // Verify Review step details
    const reviewBody = await page.innerText('main');
    console.log('Review Step Summary:\n', reviewBody.slice(0, 400));

    // Confirm Booking
    await page.click('button:has-text("Confirm & Book Trial Class")');
    await page.waitForSelector('text=Trial Class Confirmed', { timeout: 10000 });

    const successText = await page.innerText('main');
    console.log('Success Step Details:\n', successText.slice(0, 500));

    // Extract Booking ID from Success Screen
    const bookingIdMatch = successText.match(/CY-[A-Z0-9]+|[a-f0-9]{24}/);
    console.log('Captured Booking Reference / ID:', bookingIdMatch ? bookingIdMatch[0] : 'Found');

    // Verify MongoDB Booking Record
    const dbBooking = await mongoose.connection.db.collection('bookings').findOne({
      status: 'CONFIRMED',
    }, { sort: { createdAt: -1 } });

    console.log('\n--- MongoDB Verification for Test 1 ---');
    console.log('DB Booking ID:', dbBooking._id.toString());
    console.log('DB Start Time UTC:', dbBooking.startTimeUTC.toISOString());
    console.log('DB Mentor Date IST:', dbBooking.mentorDateIST);
    console.log('DB Parent Timezone:', dbBooking.parentTimezone);
    console.log('DB Mentor Timezone:', dbBooking.mentorTimezone);

    // Check mathematical accuracy:
    // 2026-10-05 15:00 America/New_York (EDT, UTC-4) => 2026-10-05T19:00:00.000Z
    // In Asia/Kolkata (UTC+5:30) => 2026-10-06 00:30:00 IST (NEXT CALENDAR DAY!)
    const expectedUtc = '2026-10-05T19:00:00.000Z';
    const actualUtc = dbBooking.startTimeUTC.toISOString();
    const isUtcMatch = actualUtc === expectedUtc;
    const isMentorDateNextDay = dbBooking.mentorDateIST === '2026-10-06';

    console.log('UTC Instant Correct:', isUtcMatch, `(Expected: ${expectedUtc}, Actual: ${actualUtc})`);
    console.log('Mentor Date is Next Day in IST (2026-10-06):', isMentorDateNextDay);

    // Switch to Mentor View
    await page.click('#nav-mentor-view');
    await page.waitForSelector('#mentor-capacity-status');

    // Query mentor schedule for the assigned mentor on 2026-10-06
    const assignedMentorDoc = await mongoose.connection.db.collection('mentors').findOne({ _id: dbBooking.mentorId });
    console.log('Assigned Mentor Name:', assignedMentorDoc.name);

    // Click mentor button in Mentor View
    await page.click(`button:has-text("${assignedMentorDoc.name}")`);
    const dateInput = await page.$('input[type="date"]');
    if (dateInput) {
      await dateInput.fill('2026-10-06');
      await dateInput.dispatchEvent('change');
    }
    await page.waitForTimeout(1000);

    const mentorTimelineText = await page.innerText('#mentor-timeline');
    console.log('Mentor Timeline Rendered Text:\n', mentorTimelineText);

    const hasIstTime = mentorTimelineText.includes('12:30 AM') || mentorTimelineText.includes('12:30');
    const hasEdtTime = mentorTimelineText.includes('03:00 PM') || mentorTimelineText.includes('3:00 PM');

    if (isUtcMatch && isMentorDateNextDay && hasIstTime && hasEdtTime) {
      results.test1 = 'PASS';
      console.log('>>> TEST 1 RESULT: PASS\n');
    } else {
      results.test1 = 'FAIL';
      console.log('>>> TEST 1 RESULT: FAIL\n');
    }

    // ----------------------------------------------------
    // TEST 2 — TWO-CLASS DAILY QUOTA EXHAUSTION
    // ----------------------------------------------------
    console.log('--------------------------------------------------------');
    console.log('TEST 2: Two-Class Daily Quota Exhaustion');
    console.log('--------------------------------------------------------');

    // Clean up test bookings for Rohan Sharma on 2026-10-05 to have clean isolation
    const rohanMentor = await mongoose.connection.db.collection('mentors').findOne({ email: 'rohan.sharma@codeyoung.com' });
    await mongoose.connection.db.collection('bookings').deleteMany({ mentorId: rohanMentor._id, mentorDateIST: '2026-10-05' });

    console.log('Target Mentor: Rohan Sharma (ID:', rohanMentor._id.toString(), ')');

    // Slot 1: 10:00 AM Europe/London on 2026-10-05 (09:00 UTC = 14:30 IST on Oct 5)
    const res1 = await fetch(`${API_URL}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        parent: { name: 'Parent One', email: 'parent1@london.com', timezone: 'Europe/London' },
        startTime: '2026-10-05T10:00:00',
        timezone: 'Europe/London',
        preferredMentorId: rohanMentor._id.toString(),
      }),
    }).then(r => r.json());

    console.log('Booking 1 Status:', res1.success, 'Mentor Assigned:', res1.data?.mentor?.name);

    // Slot 2: 11:30 AM Europe/London on 2026-10-05 (10:30 UTC = 16:00 IST on Oct 5)
    const res2 = await fetch(`${API_URL}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        parent: { name: 'Parent Two', email: 'parent2@london.com', timezone: 'Europe/London' },
        startTime: '2026-10-05T11:30:00',
        timezone: 'Europe/London',
        preferredMentorId: rohanMentor._id.toString(),
      }),
    }).then(r => r.json());

    console.log('Booking 2 Status:', res2.success, 'Mentor Assigned:', res2.data?.mentor?.name);

    // Verify Rohan in UI under Mentor View on 2026-10-05
    await page.click('#nav-mentor-view');
    await page.waitForSelector('#mentor-capacity-status');
    await page.click(`button:has-text("Rohan Sharma")`);
    const dateInputEl = await page.$('input[type="date"]');
    if (dateInputEl) {
      await dateInputEl.fill('2026-10-05');
      await dateInputEl.dispatchEvent('change');
    }
    await page.waitForTimeout(1000);

    const capacityBadgeText = await page.innerText('#mentor-capacity-status');
    console.log('Rendered Daily Capacity Badge:', capacityBadgeText);
    const isCapacityFullyBooked = capacityBadgeText.includes('2/2 Capacity Reached') || capacityBadgeText.includes('Fully Booked');

    // Attempt 3rd booking specifically for Rohan on same calendar day (2026-10-05 IST)
    const res3Strict = await fetch(`${API_URL}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        parent: { name: 'Parent Three', email: 'parent3@london.com', timezone: 'Europe/London' },
        startTime: '2026-10-05T13:00:00',
        timezone: 'Europe/London',
        preferredMentorId: rohanMentor._id.toString(),
        strictMentor: true,
      }),
    }).then(r => r.json());

    console.log('Attempt 3 with strict Rohan quota response:\n', res3Strict);

    // Count Rohan's total bookings in MongoDB on 2026-10-05
    const rohanBookingsCount = await mongoose.connection.db.collection('bookings').countDocuments({
      mentorId: rohanMentor._id,
      mentorDateIST: '2026-10-05',
    });
    console.log(`DB Verification: Rohan Sharma total bookings on 2026-10-05 IST = ${rohanBookingsCount}/2`);

    // Also test automatic fallback (Option A: without strictMentor, system assigns another available mentor)
    const res3Fallback = await fetch(`${API_URL}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        parent: { name: 'Parent Four', email: 'parent4@london.com', timezone: 'Europe/London' },
        startTime: '2026-10-05T13:00:00',
        timezone: 'Europe/London',
        preferredMentorId: rohanMentor._id.toString(),
        strictMentor: false,
      }),
    }).then(r => r.json());

    console.log('Attempt 3 load-balancing reassignment (Option A):', res3Fallback.success, 'Assigned Mentor:', res3Fallback.data?.mentor?.name);
    const assignedAnotherMentor = res3Fallback.data?.mentor?.id !== rohanMentor._id.toString();

    if (isCapacityFullyBooked && rohanBookingsCount === 2 && !res3Strict.success && assignedAnotherMentor) {
      results.test2 = 'PASS';
      console.log('>>> TEST 2 RESULT: PASS\n');
    } else {
      results.test2 = 'FAIL';
      console.log('>>> TEST 2 RESULT: FAIL\n');
    }

    // ----------------------------------------------------
    // TEST 3 — DAYLIGHT SAVING TIME TRANSITION
    // ----------------------------------------------------
    console.log('--------------------------------------------------------');
    console.log('TEST 3: Daylight Saving Time Transition (2026 US DST)');
    console.log('--------------------------------------------------------');

    // Part A: Before DST (October 28, 2026 — EDT = UTC-4)
    // 9:00 AM EDT -> 13:00 UTC (1:00 PM UTC) -> 18:30 IST (6:30 PM IST)
    const slotsPreDST = await fetch(`${API_URL}/slots/available?date=2026-10-28&timezone=America/New_York`).then(r => r.json());
    const slot9amPre = slotsPreDST.data?.slots?.find(s => s.localTime === '09:00 AM');
    console.log('Pre-DST Slot (2026-10-28 09:00 AM EDT):');
    console.log('  - Start UTC:', slot9amPre?.startTimeUTC);
    console.log('  - Mentor Time IST:', slot9amPre?.mentorTimeIST);

    const isPreDstCorrect = slot9amPre?.startTimeUTC === '2026-10-28T13:00:00.000Z' && slot9amPre?.mentorTimeIST === '06:30 PM IST';

    // Part B: After DST (November 03, 2026 — EST = UTC-5)
    // 9:00 AM EST -> 14:00 UTC (2:00 PM UTC) -> 19:30 IST (7:30 PM IST)
    const slotsPostDST = await fetch(`${API_URL}/slots/available?date=2026-11-03&timezone=America/New_York`).then(r => r.json());
    const slot9amPost = slotsPostDST.data?.slots?.find(s => s.localTime === '09:00 AM');
    console.log('Post-DST Slot (2026-11-03 09:00 AM EST):');
    console.log('  - Start UTC:', slot9amPost?.startTimeUTC);
    console.log('  - Mentor Time IST:', slot9amPost?.mentorTimeIST);

    const isPostDstCorrect = slot9amPost?.startTimeUTC === '2026-11-03T14:00:00.000Z' && slot9amPost?.mentorTimeIST === '07:30 PM IST';

    // Book both in DB to verify stored UTC instances
    const bookPre = await fetch(`${API_URL}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        parent: { name: 'DST Parent A', email: 'dst.a@example.com', timezone: 'America/New_York' },
        startTime: '2026-10-28T09:00:00',
        timezone: 'America/New_York',
      }),
    }).then(r => r.json());

    const bookPost = await fetch(`${API_URL}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        parent: { name: 'DST Parent B', email: 'dst.b@example.com', timezone: 'America/New_York' },
        startTime: '2026-11-03T09:00:00',
        timezone: 'America/New_York',
      }),
    }).then(r => r.json());

    console.log('DB Stored Booking Pre-DST UTC:', bookPre.data?.appointment?.startTimeUTC);
    console.log('DB Stored Booking Post-DST UTC:', bookPost.data?.appointment?.startTimeUTC);
    console.log('Zone Abbr Pre-DST:', bookPre.data?.parentLocalTime?.zoneAbbreviation, '(Expected: EDT)');
    console.log('Zone Abbr Post-DST:', bookPost.data?.parentLocalTime?.zoneAbbreviation, '(Expected: EST)');

    if (isPreDstCorrect && isPostDstCorrect && bookPre.data?.parentLocalTime?.zoneAbbreviation === 'EDT' && bookPost.data?.parentLocalTime?.zoneAbbreviation === 'EST') {
      results.test3 = 'PASS';
      console.log('>>> TEST 3 RESULT: PASS\n');
    } else {
      results.test3 = 'FAIL';
      console.log('>>> TEST 3 RESULT: FAIL\n');
    }

    // ----------------------------------------------------
    // TEST 4 — COMPLETE BACKEND FAILURE / NETWORK ERROR
    // ----------------------------------------------------
    console.log('--------------------------------------------------------');
    console.log('TEST 4: Complete Backend Failure / Network Error');
    console.log('--------------------------------------------------------');

    // Navigate to fresh Booking page (Step 1)
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    const startBtn = await page.$('#header-book-trial-cta');
    if (startBtn) {
      await startBtn.click();
    }
    await page.waitForSelector('#studentName');

    // Fill details and go to Step 2
    await page.fill('#studentName', 'Maya Lin');
    await page.fill('#parentName', 'Grace Lin');
    await page.fill('#parentEmail', 'grace.lin@example.com');
    await page.click('button[type="submit"]');
    await page.waitForSelector('#date-picker-input');

    // Verify slots load normally initially
    await page.waitForSelector('button:has-text("AM"), button:has-text("PM")');
    console.log('Initial slots loaded successfully.');

    // Now simulate backend failure by intercepting and failing network requests
    await page.route('**/api/**', route => route.abort('failed'));

    // Trigger date change to cause API failure
    const picker = await page.$('#date-picker-input');
    if (picker) {
      await picker.fill('2026-10-15');
      await picker.dispatchEvent('change');
    }
    await page.waitForTimeout(1000);

    const errorStateText = await page.innerText('main');
    console.log('Error state rendered text:\n', errorStateText.slice(0, 300));

    const isWhiteScreen = errorStateText.trim().length === 0;
    const hasFriendlyError = errorStateText.includes('Could Not Load Slots') || errorStateText.includes('Failed to fetch') || errorStateText.includes('Network Error');
    const hasNoCrash = !errorStateText.includes('TypeError') && !errorStateText.includes('Unhandled Rejection');

    console.log('White screen crashed:', isWhiteScreen);
    console.log('Rendered friendly error banner:', hasFriendlyError);
    console.log('Application remained intact without crash:', hasNoCrash);

    // Unroute network intercept (simulating backend restored)
    await page.unroute('**/api/**');

    // Click Refresh button
    const refreshBtn = await page.$('button:has-text("Refresh")');
    if (refreshBtn) {
      await refreshBtn.click();
    }
    await page.waitForTimeout(1500);

    const recoveredSlots = await page.$$('button:has-text("AM"), button:has-text("PM")');
    console.log('Slots recovered upon backend restoration:', recoveredSlots.length > 0);

    if (!isWhiteScreen && hasFriendlyError && hasNoCrash && recoveredSlots.length > 0) {
      results.test4 = 'PASS';
      console.log('>>> TEST 4 RESULT: PASS\n');
    } else {
      results.test4 = 'FAIL';
      console.log('>>> TEST 4 RESULT: FAIL\n');
    }

  } catch (err) {
    console.error('Test execution encountered error:', err);
  } finally {
    await browser.close();
    await mongoose.disconnect();
    console.log('\n========================================================');
    console.log('ACCEPTANCE TEST SUMMARY:', JSON.stringify(results, null, 2));
    console.log('========================================================');
  }
}

runAllTests();
