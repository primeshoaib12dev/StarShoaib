import test from 'node:test';
import assert from 'node:assert/strict';
import {
  INITIAL_APP_STATE,
  applyMissionToggle,
  calculateRankInfo,
  filterActivity,
  filterMissions,
  filterVehicles,
  formatCurrency,
  getLoadingPhaseLabel,
  shouldAutostartFromSearch,
  validateNewMission,
  validateProfileUpdate,
} from './dashboardLogic';

test('getLoadingPhaseLabel maps progress ranges accurately', () => {
  assert.equal(getLoadingPhaseLabel(0), 'Initializing ShoaibStar Engine');
  assert.equal(getLoadingPhaseLabel(30), 'Loading City & Garage Assets');
  assert.equal(getLoadingPhaseLabel(65), 'Syncing Player Profile & Missions');
  assert.equal(getLoadingPhaseLabel(95), 'Preparing Main Dashboard');
  assert.equal(getLoadingPhaseLabel(100), 'Ready');
});

test('calculateRankInfo derives rank, title, and level progress', () => {
  const rank1 = calculateRankInfo(0);
  assert.equal(rank1.rank, 1);
  assert.equal(rank1.title, 'Street Rookie');
  assert.equal(rank1.progressPct, 0);

  const rank3 = calculateRankInfo(1420);
  assert.equal(rank3.rank, 3);
  assert.equal(rank3.title, 'District Captain');
  assert.equal(rank3.currentLevelXp, 420);
  assert.equal(rank3.progressPct, 84);
});

test('filterMissions separates active and completed missions', () => {
  const all = filterMissions(INITIAL_APP_STATE.missions, 'all');
  const active = filterMissions(INITIAL_APP_STATE.missions, 'active');
  const completed = filterMissions(INITIAL_APP_STATE.missions, 'completed');

  assert.equal(all.length, 4);
  assert.equal(active.length, 3);
  assert.equal(completed.length, 1);
});

test('validateNewMission rejects invalid inputs and accepts valid ones', () => {
  assert.equal(
    validateNewMission({ title: '', district: 'Harbour', rewardCash: 5000, rewardXp: 100 }).valid,
    false
  );
  assert.equal(
    validateNewMission({ title: 'Run', district: '', rewardCash: 5000, rewardXp: 100 }).valid,
    false
  );
  assert.equal(
    validateNewMission({ title: 'Sprint Run', district: 'Harbour', rewardCash: 0, rewardXp: 100 }).valid,
    false
  );
  assert.equal(
    validateNewMission({ title: 'Sprint Run', district: 'Harbour', rewardCash: 5000, rewardXp: 150 }).valid,
    true
  );
});

test('validateProfileUpdate validates callsign and crewTag lengths', () => {
  assert.equal(validateProfileUpdate({ callsign: 'S', crewTag: 'STAR' }).valid, false);
  assert.equal(validateProfileUpdate({ callsign: 'Shoaib', crewTag: 'TOOLONG' }).valid, false);
  assert.equal(validateProfileUpdate({ callsign: 'Shoaib', crewTag: 'STAR' }).valid, true);
});

test('applyMissionToggle updates cash, xp, completion state, and activity log', () => {
  const startCash = INITIAL_APP_STATE.cashBalance;
  const startXp = INITIAL_APP_STATE.respectXp;
  const target = INITIAL_APP_STATE.missions[0]; // incomplete, $18,500, 250 XP

  const afterComplete = applyMissionToggle(INITIAL_APP_STATE, target.id);
  assert.equal(afterComplete.cashBalance, startCash + target.rewardCash);
  assert.equal(afterComplete.respectXp, startXp + target.rewardXp);
  assert.equal(afterComplete.missions[0].completed, true);
  assert.equal(afterComplete.activity[0].title, target.title);

  const afterUndo = applyMissionToggle(afterComplete, target.id);
  assert.equal(afterUndo.cashBalance, startCash);
  assert.equal(afterUndo.respectXp, startXp);
  assert.equal(afterUndo.missions[0].completed, false);
});

test('filterActivity and filterVehicles filter by category', () => {
  assert.equal(filterActivity(INITIAL_APP_STATE.activity, 'income').length, 1);
  assert.equal(filterVehicles(INITIAL_APP_STATE.vehicles, 'bike').length, 1);
  assert.equal(filterVehicles(INITIAL_APP_STATE.vehicles, 'all').length, 3);
});

test('formatCurrency and shouldAutostartFromSearch behave deterministically', () => {
  assert.equal(formatCurrency(248500), '$248,500');
  assert.equal(shouldAutostartFromSearch('?autostart=1'), true);
  assert.equal(shouldAutostartFromSearch('?foo=bar'), false);
  assert.equal(shouldAutostartFromSearch(''), false);
});
