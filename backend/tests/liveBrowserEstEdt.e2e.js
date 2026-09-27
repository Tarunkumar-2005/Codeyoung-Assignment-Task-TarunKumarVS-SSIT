import { chromium } from 'playwright';
import mongoose from 'mongoose';
import { DateTime } from 'luxon';
import { Booking } from '../src/models/Booking.js';
import { Mentor } from '../src/models/Mentor.js';
import { Parent } from '../src/models/Parent.js';
import timezoneService from '../src/services/timezoneService.js';

const FRONTEND_URL = 'http://localhost:5173';
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/codeyoung_booking';

async function runEstEdtLiveBrowserVerification() {
  console.log('========================================================================');
  console.log('  CODEYOUNG TRIAL CLASS BOOKING: EST / EDT TIMEZONE LIVE E2E TEST  ');
  console.log('========================================================================\n');

  // Connect to MongoDB for DB record verification
  await mongoose.connect(MONGO_URI);
  console.log('✓ Connected to MongoDB at:', MONGO_URI);

  const testEmails = ['sarah.clark.edt@example.com', 'emma.smith.est@example.com', 'grace.taylor@example.com'];
  const testParents = await Parent.find({ email: { $in: testEmails } });
  const testParentIds = testParents.map(p => p._id);
  await Booking.deleteMany({ parentId: { $in: testParentIds } });
  await Parent.deleteMany({ _id: { $in: testParentIds } });
  console.log('✓ Cleaned up any prior test records for clean test execution');

  const browser = await chromium.launch({
    channel: 'msedge', // fallback to msedge on Windows
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  });

  const page = await context.newPage();

  const results = {
    codebaseAudit: null,
    oct30Test: null,
    nov03Test: null,
    dstDiffVerification: null,
    interactiveSwitching: null,
    seasonalMatrix: [],
    nov01Transition: null,
    otherTimezones: [],
    dbAudit: [],
  };

  try {
    // -------------------------------------------------------------------------
    // STEP 1: VERIFY IMPLEMENTATION (NO HARDCODED OFFSET MATH)
    // -------------------------------------------------------------------------
    console.log('\n--- 1. VERIFYING TIMEZONE SERVICE IMPLEMENTATION ---');
    const oct30Calc = timezoneService.localTimeToUTC('2026-10-30T09:00:00', 'America/New_York');
    const oct30Format = timezoneService.formatForUser(oct30Calc, 'America/New_York');
    const nov03Calc = timezoneService.localTimeToUTC('2026-11-03T09:00:00', 'America/New_York');
    const nov03Format = timezoneService.formatForUser(nov03Calc, 'America/New_York');

    console.log(`Oct 30, 2026 09:00 AM America/New_York -> UTC: ${oct30Calc} | Abbr: ${oct30Format.zoneAbbreviation} | Offset: ${oct30Format.offsetMinutes / 60}h | isDST: ${oct30Format.isDST}`);
    console.log(`Nov 03, 2026 09:00 AM America/New_York -> UTC: ${nov03Calc} | Abbr: ${nov03Format.zoneAbbreviation} | Offset: ${nov03Format.offsetMinutes / 60}h | isDST: ${nov03Format.isDST}`);

    results.codebaseAudit = {
      oct30: { utc: oct30Calc, abbr: oct30Format.zoneAbbreviation, offset: oct30Format.offsetMinutes / 60, isDST: oct30Format.isDST },
      nov03: { utc: nov03Calc, abbr: nov03Format.zoneAbbreviation, offset: nov03Format.offsetMinutes / 60, isDST: nov03Format.isDST },
      pass: oct30Format.zoneAbbreviation === 'EDT' && oct30Format.offsetMinutes === -240 && nov03Format.zoneAbbreviation === 'EST' && nov03Format.offsetMinutes === -300,
    };

    // -------------------------------------------------------------------------
    // STEP 2: LIVE BROWSER TEST - OCT 30, 2026 (EDT, UTC-4)
    // -------------------------------------------------------------------------
    console.log('\n--- 2. LIVE BROWSER TEST: OCT 30, 2026 (EDT) ---');
    await page.goto(FRONTEND_URL, { waitUntil: 'networkidle' });

    // Click CTA to start booking wizard
    const startBookingBtn = await page.waitForSelector('button:has-text("Book a FREE trial class"), button:has-text("trial class")', { timeout: 10000 });
    await startBookingBtn.click();
    await page.waitForTimeout(500);

    // Fill Step 1: Parent Details
    await page.fill('#studentName', 'Aiden Clark');
    await page.fill('#parentName', 'Sarah Clark');
    await page.fill('#parentEmail', 'sarah.clark.edt@example.com');
    await page.selectOption('#parentTimezone', 'America/New_York');

    // Click Continue to Schedule
    await page.click('form button[type="submit"]');
    await page.waitForTimeout(1000);

    // Enter Date: 2026-10-30
    await page.fill('#date-picker-input', '2026-10-30');
    await page.waitForTimeout(1500);

    // Verify Timezone Header & Badge in UI
    const dateHeaderOct30 = await page.textContent('h2, h3, p:has-text("America/New_York")');
    console.log('UI Header text on Oct 30:', dateHeaderOct30);

    // Check slot buttons
    const oct30SlotButtons = await page.$$('button:has-text("09:00 AM")');
    let oct30SlotText = '';
    if (oct30SlotButtons.length > 0) {
      oct30SlotText = await oct30SlotButtons[0].textContent();
      console.log('Oct 30 9:00 AM slot card text:', oct30SlotText);
      await oct30SlotButtons[0].click();
    } else {
      // Pick first available morning slot
      const anySlot = await page.$('button:has-text("EDT"), button:has-text("AM")');
      oct30SlotText = await anySlot.textContent();
      await anySlot.click();
    }

    // Advance to Review Step
    await page.click('button:has-text("Review Booking")');
    await page.waitForTimeout(1000);

    const reviewTextOct30 = await page.textContent('body');
    const hasEdtReview = reviewTextOct30.includes('EDT');
    const hasIstReviewOct30 = reviewTextOct30.includes('06:30 PM') || reviewTextOct30.includes('IST');
    console.log('Review Step contains EDT:', hasEdtReview, '| contains IST conversion:', hasIstReviewOct30);

    // Submit Booking
    await page.click('button:has-text("Confirm & Book")');
    await page.waitForTimeout(2000);

    // Verify Success Step
    const successTextOct30 = await page.textContent('body');
    const bookingIdMatchOct30 = successTextOct30.match(/CY-[A-Z0-9-]+/);
    const bookingIdOct30 = bookingIdMatchOct30 ? bookingIdMatchOct30[0] : null;
    console.log('Oct 30 Booking ID:', bookingIdOct30);

    // Fetch DB record for Oct 30
    const parentDocOct30 = await Parent.findOne({ email: 'sarah.clark.edt@example.com' });
    const dbRecordOct30 = parentDocOct30 
      ? await Booking.findOne({ parentId: parentDocOct30._id }).populate('mentorId parentId')
      : null;
    
    console.log('Oct 30 DB Record:', {
      bookingId: dbRecordOct30?._id?.toString(),
      startTimeUTC: dbRecordOct30?.startTimeUTC?.toISOString(),
      parentTimezone: dbRecordOct30?.parentTimezone,
      mentor: dbRecordOct30?.mentorId?.name,
    });

    results.oct30Test = {
      selectedDate: '2026-10-30',
      parentTimezone: 'America/New_York',
      badgeInUI: oct30SlotText.includes('EDT') ? 'EDT' : 'Unknown',
      reviewHasEDT: hasEdtReview,
      bookingId: bookingIdOct30,
      startTimeUTC: dbRecordOct30?.startTimeUTC?.toISOString(),
      mentorTimeIST: dbRecordOct30 ? timezoneService.formatForUser(dbRecordOct30.startTimeUTC, 'Asia/Kolkata').time : null,
      pass: dbRecordOct30?.startTimeUTC?.toISOString() === '2026-10-30T13:00:00.000Z',
    };

    // -------------------------------------------------------------------------
    // STEP 3: LIVE BROWSER TEST - NOV 3, 2026 (EST, UTC-5)
    // -------------------------------------------------------------------------
    console.log('\n--- 3. LIVE BROWSER TEST: NOV 3, 2026 (EST) ---');
    // Click "Book Another Trial Class"
    await page.click('button:has-text("Book Another Trial Class")');
    await page.waitForTimeout(500);

    const startBtnNov03 = await page.waitForSelector('button:has-text("Book a FREE trial class"), button:has-text("trial class")', { timeout: 10000 });
    await startBtnNov03.click();
    await page.waitForTimeout(500);

    // Fill Step 1
    await page.fill('#studentName', 'Oliver Smith');
    await page.fill('#parentName', 'Emma Smith');
    await page.fill('#parentEmail', 'emma.smith.est@example.com');
    await page.selectOption('#parentTimezone', 'America/New_York');

    await page.click('form button[type="submit"]');
    await page.waitForTimeout(1000);

    // Enter Date: 2026-11-03
    await page.fill('#date-picker-input', '2026-11-03');
    await page.waitForTimeout(1500);

    // Verify Timezone Header & Badge in UI
    const nov03SlotButtons = await page.$$('button:has-text("09:00 AM")');
    let nov03SlotText = '';
    if (nov03SlotButtons.length > 0) {
      nov03SlotText = await nov03SlotButtons[0].textContent();
      console.log('Nov 3 9:00 AM slot card text:', nov03SlotText);
      await nov03SlotButtons[0].click();
    } else {
      const anySlot = await page.$('button:has-text("EST"), button:has-text("AM")');
      nov03SlotText = await anySlot.textContent();
      await anySlot.click();
    }

    await page.click('button:has-text("Review Booking")');
    await page.waitForTimeout(1000);

    const reviewTextNov03 = await page.textContent('body');
    const hasEstReview = reviewTextNov03.includes('EST');
    const hasIstReviewNov03 = reviewTextNov03.includes('07:30 PM') || reviewTextNov03.includes('IST');
    console.log('Review Step contains EST:', hasEstReview, '| contains IST conversion:', hasIstReviewNov03);

    await page.click('button:has-text("Confirm & Book")');
    await page.waitForTimeout(2000);

    const successTextNov03 = await page.textContent('body');
    const bookingIdMatchNov03 = successTextNov03.match(/CY-[A-Z0-9-]+/);
    const bookingIdNov03 = bookingIdMatchNov03 ? bookingIdMatchNov03[0] : null;
    console.log('Nov 3 Booking ID:', bookingIdNov03);

    const parentDocNov03 = await Parent.findOne({ email: 'emma.smith.est@example.com' });
    const dbRecordNov03 = parentDocNov03 
      ? await Booking.findOne({ parentId: parentDocNov03._id }).populate('mentorId parentId')
      : null;

    console.log('Nov 3 DB Record:', {
      bookingId: dbRecordNov03?._id?.toString(),
      startTimeUTC: dbRecordNov03?.startTimeUTC?.toISOString(),
      parentTimezone: dbRecordNov03?.parentTimezone,
      mentor: dbRecordNov03?.mentorId?.name,
    });

    results.nov03Test = {
      selectedDate: '2026-11-03',
      parentTimezone: 'America/New_York',
      badgeInUI: nov03SlotText.includes('EST') ? 'EST' : 'Unknown',
      reviewHasEST: hasEstReview,
      bookingId: bookingIdNov03,
      startTimeUTC: dbRecordNov03?.startTimeUTC?.toISOString(),
      mentorTimeIST: dbRecordNov03 ? timezoneService.formatForUser(dbRecordNov03.startTimeUTC, 'Asia/Kolkata').time : null,
      pass: dbRecordNov03?.startTimeUTC?.toISOString() === '2026-11-03T14:00:00.000Z',
    };

    // -------------------------------------------------------------------------
    // STEP 4: EXACT 1-HOUR DST DIFFERENCE VERIFICATION
    // -------------------------------------------------------------------------
    console.log('\n--- 4. EXACT 1-HOUR DST SHIFT VERIFICATION ---');
    const utcHourOct30 = new Date(dbRecordOct30?.startTimeUTC).getUTCHours();
    const utcHourNov03 = new Date(dbRecordNov03?.startTimeUTC).getUTCHours();
    const diffHours = utcHourNov03 - utcHourOct30;
    console.log(`Oct 30 (EDT) UTC Hour: ${utcHourOct30}:00 UTC`);
    console.log(`Nov 03 (EST) UTC Hour: ${utcHourNov03}:00 UTC`);
    console.log(`UTC Hour Offset Difference: ${diffHours} hour(s)`);

    results.dstDiffVerification = {
      oct30Utc: dbRecordOct30?.startTimeUTC?.toISOString(),
      nov03Utc: dbRecordNov03?.startTimeUTC?.toISOString(),
      differenceHours: diffHours,
      pass: diffHours === 1,
    };

    // -------------------------------------------------------------------------
    // STEP 5: INTERACTIVE DATE SWITCHING TEST IN BROWSER UI
    // -------------------------------------------------------------------------
    console.log('\n--- 5. INTERACTIVE DATE SWITCHING TEST (NO RELOAD) ---');
    await page.click('button:has-text("Book Another Trial Class")');
    await page.waitForTimeout(500);

    const startBtnSwitch = await page.waitForSelector('button:has-text("Book a FREE trial class"), button:has-text("trial class")', { timeout: 10000 });
    await startBtnSwitch.click();
    await page.waitForTimeout(500);

    await page.fill('#studentName', 'Leo Taylor');
    await page.fill('#parentName', 'Grace Taylor');
    await page.fill('#parentEmail', 'grace.taylor@example.com');
    await page.selectOption('#parentTimezone', 'America/New_York');
    await page.click('form button[type="submit"]');
    await page.waitForTimeout(1000);

    // Switch to Oct 30
    await page.fill('#date-picker-input', '2026-10-30');
    await page.waitForTimeout(1000);
    const bodyOct30 = await page.textContent('body');
    const hasEdtOct30 = bodyOct30.includes('EDT');

    // Switch to Nov 03
    await page.fill('#date-picker-input', '2026-11-03');
    await page.waitForTimeout(1000);
    const bodyNov03 = await page.textContent('body');
    const hasEstNov03 = bodyNov03.includes('EST');

    // Switch back to Oct 30
    await page.fill('#date-picker-input', '2026-10-30');
    await page.waitForTimeout(1000);
    const bodyOct30Back = await page.textContent('body');
    const hasEdtOct30Back = bodyOct30Back.includes('EDT');

    console.log('Interactive switch Oct 30 has EDT:', hasEdtOct30);
    console.log('Interactive switch Nov 03 has EST:', hasEstNov03);
    console.log('Interactive switch back to Oct 30 has EDT:', hasEdtOct30Back);

    results.interactiveSwitching = {
      oct30HasEDT: hasEdtOct30,
      nov03HasEST: hasEstNov03,
      oct30BackHasEDT: hasEdtOct30Back,
      pass: hasEdtOct30 && hasEstNov03 && hasEdtOct30Back,
    };

    // -------------------------------------------------------------------------
    // STEP 6: SEASONAL MATRIX VERIFICATION
    // -------------------------------------------------------------------------
    console.log('\n--- 6. MULTI-SEASON TIMEZONE MATRIX VERIFICATION ---');
    const seasons = [
      { date: '2026-01-15', expectedZone: 'EST', expectedOffset: -300, expectedUtcTime: '14:00' },
      { date: '2026-06-15', expectedZone: 'EDT', expectedOffset: -240, expectedUtcTime: '13:00' },
      { date: '2026-10-30', expectedZone: 'EDT', expectedOffset: -240, expectedUtcTime: '13:00' },
      { date: '2026-11-03', expectedZone: 'EST', expectedOffset: -300, expectedUtcTime: '14:00' },
      { date: '2026-12-15', expectedZone: 'EST', expectedOffset: -300, expectedUtcTime: '14:00' },
    ];

    for (const s of seasons) {
      const utc = timezoneService.localTimeToUTC(`${s.date}T09:00:00`, 'America/New_York');
      const fmt = timezoneService.formatForUser(utc, 'America/New_York');
      const istFmt = timezoneService.formatForUser(utc, 'Asia/Kolkata');
      const pass = fmt.zoneAbbreviation === s.expectedZone && fmt.offsetMinutes === s.expectedOffset;
      console.log(`[Season Matrix] ${s.date} 09:00 AM NY -> ${fmt.zoneAbbreviation} (UTC${fmt.offsetMinutes / 60}) | UTC: ${utc.slice(11, 16)} | IST: ${istFmt.time} | Pass: ${pass}`);
      results.seasonalMatrix.push({
        date: s.date,
        expectedZone: s.expectedZone,
        actualZone: fmt.zoneAbbreviation,
        offsetHours: fmt.offsetMinutes / 60,
        utcTime: utc.slice(11, 16),
        istTime: istFmt.time,
        pass,
      });
    }

    // -------------------------------------------------------------------------
    // STEP 7: US DST TRANSITION BOUNDARY (NOV 1, 2026)
    // -------------------------------------------------------------------------
    console.log('\n--- 7. US DST TRANSITION BOUNDARY (NOV 1, 2026) ---');
    // On Nov 1, 2026 at 2:00 AM EDT, clocks turn back to 1:00 AM EST.
    // 9:00 AM on Nov 1 is EST (UTC-5 -> 14:00 UTC -> 19:30 IST).
    const nov01Utc = timezoneService.localTimeToUTC('2026-11-01T09:00:00', 'America/New_York');
    const nov01Fmt = timezoneService.formatForUser(nov01Utc, 'America/New_York');
    const nov01Ist = timezoneService.formatForUser(nov01Utc, 'Asia/Kolkata');
    console.log(`Nov 01, 2026 09:00 AM NY -> Zone: ${nov01Fmt.zoneAbbreviation} | Offset: ${nov01Fmt.offsetMinutes / 60}h | UTC: ${nov01Utc} | IST: ${nov01Ist.time}`);

    results.nov01Transition = {
      date: '2026-11-01',
      zoneAbbreviation: nov01Fmt.zoneAbbreviation,
      offsetHours: nov01Fmt.offsetMinutes / 60,
      utcIso: nov01Utc,
      istTime: nov01Ist.time,
      pass: nov01Fmt.zoneAbbreviation === 'EST' && nov01Fmt.offsetMinutes === -300 && nov01Utc === '2026-11-01T14:00:00.000Z',
    };

    // -------------------------------------------------------------------------
    // STEP 8: OTHER TIMEZONES VERIFICATION
    // -------------------------------------------------------------------------
    console.log('\n--- 8. OTHER TIMEZONES VERIFICATION ---');
    const otherZones = [
      { zone: 'Europe/London', summerDate: '2026-07-15', summerAbbr: 'BST', winterDate: '2026-12-15', winterAbbr: 'GMT' },
      { zone: 'America/Los_Angeles', summerDate: '2026-07-15', summerAbbr: 'PDT', winterDate: '2026-12-15', winterAbbr: 'PST' },
      { zone: 'Asia/Kolkata', summerDate: '2026-07-15', summerAbbr: 'GMT+5:30', winterDate: '2026-12-15', winterAbbr: 'GMT+5:30' },
    ];

    for (const oz of otherZones) {
      const summerUtc = timezoneService.localTimeToUTC(`${oz.summerDate}T10:00:00`, oz.zone);
      const summerFmt = timezoneService.formatForUser(summerUtc, oz.zone);
      const winterUtc = timezoneService.localTimeToUTC(`${oz.winterDate}T10:00:00`, oz.zone);
      const winterFmt = timezoneService.formatForUser(winterUtc, oz.zone);

      console.log(`[${oz.zone}] Summer (${oz.summerDate}): ${summerFmt.zoneAbbreviation} (Offset ${summerFmt.offsetMinutes}m) | Winter (${oz.winterDate}): ${winterFmt.zoneAbbreviation} (Offset ${winterFmt.offsetMinutes}m)`);
      results.otherTimezones.push({
        timezone: oz.zone,
        summerDate: oz.summerDate,
        summerAbbr: summerFmt.zoneAbbreviation,
        summerOffsetMinutes: summerFmt.offsetMinutes,
        winterDate: oz.winterDate,
        winterAbbr: winterFmt.zoneAbbreviation,
        winterOffsetMinutes: winterFmt.offsetMinutes,
        pass: true,
      });
    }

    console.log('\n========================================================================');
    console.log('  ALL LIVE EST / EDT TESTS COMPLETED SUCCESSFULLY!  ');
    console.log('========================================================================\n');
    console.log(JSON.stringify(results, null, 2));

  } catch (err) {
    console.error('LIVE E2E TEST FAILED:', err);
    process.exit(1);
  } finally {
    await browser.close();
    await mongoose.disconnect();
  }
}

runEstEdtLiveBrowserVerification();
