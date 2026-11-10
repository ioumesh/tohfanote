import test from 'node:test';
import assert from 'node:assert/strict';
import {zonedISO} from '../lib/gift.ts';
test('IANA timezones map to exact UTC instants',t=>{t.mock.method(Date,'now',()=>Date.parse('2026-11-10T00:00:00Z'));assert.equal(zonedISO('2027-01-15T00:00','Asia/Kolkata'),'2027-01-14T18:30:00.000Z');assert.equal(zonedISO('2027-01-15T00:00','America/New_York'),'2027-01-15T05:00:00.000Z');});
test('daylight saving gaps and repeated hours are rejected',t=>{t.mock.method(Date,'now',()=>Date.parse('2026-11-10T00:00:00Z'));assert.throws(()=>zonedISO('2027-03-14T02:30','America/New_York'),/does not exist/);assert.throws(()=>zonedISO('2027-11-07T01:30','America/New_York'),/happens twice/);});
test('past dates and invalid dates are rejected; no schedule is allowed',()=>{assert.throws(()=>zonedISO('2020-01-01T00:00','UTC'),/future/);assert.throws(()=>zonedISO('invalid','UTC'),/valid/);assert.equal(zonedISO('','UTC'),null);});
