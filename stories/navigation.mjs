// Scroll distance is accumulated, not throttled to one event per gesture.
export class WheelNavigator {
  constructor() { this.index = 0; this.count = 0; this.total = 0; this.last = -Infinity; }
  setIndex(index, count) { this.index = index; this.count = count; }
  consume(delta, now) {
    if (!Number.isFinite(delta) || this.count < 1) return this.index;
    if (now - this.last > 240 || (this.total && Math.sign(this.total) !== Math.sign(delta))) this.total = 0;
    this.last = now;
    this.total += delta;
    const steps = Math.trunc(this.total / 90);
    if (steps) {
      this.total -= steps * 90;
      this.index = Math.max(0, Math.min(this.count - 1, this.index + steps));
      if (this.index === 0 || this.index === this.count - 1) this.total = 0;
    }
    return this.index;
  }
}
export function nearestTimelineIndex(y, rows) {
  let nearest = -1, distance = Infinity;
  rows.forEach((row, index) => {
    const next = Math.abs(y - (row.top + row.height / 2));
    if (next < distance) { distance = next; nearest = index; }
  });
  return nearest;
}
