/* A clock-independent model, shared by the UI and the automated tests. */
(function (root) {
  'use strict';
  class ClassroomTimer {
    constructor(now = () => performance.now()) { this.now = now; this.durationMs = 300000; this.remainingMs = this.durationMs; this.deadlineMs = null; this.status = 'idle'; }
    setDuration(ms) { if (this.status !== 'idle' && this.status !== 'finished') return false; if (!Number.isInteger(ms) || ms < 1000 || ms > 5999000) return false; this.durationMs = ms; this.reset(); return true; }
    start() { if (this.status === 'running') return false; if (this.status === 'finished') this.reset(); this.deadlineMs = this.now() + this.remainingMs; this.status = 'running'; return true; }
    tick() { if (this.status !== 'running') return false; this.remainingMs = Math.max(0, this.deadlineMs - this.now()); if (this.remainingMs === 0) { this.status = 'finished'; this.deadlineMs = null; return true; } return false; }
    pause() { if (this.status !== 'running') return false; if (this.tick()) return true; this.status = 'paused'; this.deadlineMs = null; return false; }
    reset() { this.remainingMs = this.durationMs; this.deadlineMs = null; this.status = 'idle'; }
  }
  function parseDuration(minutes, seconds) {
    if (!/^\d+$/.test(minutes) || !/^\d+$/.test(seconds)) return null;
    const m = Number(minutes), s = Number(seconds);
    if (m > 99 || s > 59 || m * 60 + s < 1) return null;
    return (m * 60 + s) * 1000;
  }
  function formatTime(ms) { const total = Math.ceil(Math.max(0, ms) / 1000); return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`; }
  const api = { ClassroomTimer, parseDuration, formatTime };
  root.ClassroomTimerCore = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
