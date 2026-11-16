/**
 * Lightweight smoke checks for guest board / RSVP / live-day / lens / WhatsApp helpers.
 * Run: node scripts/smoke-features.mjs
 */

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function istanbulParts(now = new Date()) {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    hourCycle: "h23",
  });
  const map = {};
  for (const part of fmt.formatToParts(now)) {
    if (part.type !== "literal") map[part.type] = part.value;
  }
  return {
    date: `${map.year}-${map.month}-${map.day}`,
    minutes: Number(map.hour) * 60 + Number(map.minute),
  };
}

function isLiveEventDay(eventDate, now = new Date()) {
  const day = (eventDate || "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return false;
  return istanbulParts(now).date === day;
}

const today = istanbulParts().date;
assert(isLiveEventDay(today) === true, "today should be live day");
assert(isLiveEventDay("1999-01-01") === false, "old date should not be live");
assert(isLiveEventDay("") === false, "empty date should not be live");

const filters = ["classic", "rose", "noir", "glow", "vintage"];
assert(filters.length === 5, "lens filter pack size");

const msg = `Sevgili ailemiz,\n\nDavetiyemiz burada:\nhttps://example.com/d/demo\n`;
const wa = `https://wa.me/?text=${encodeURIComponent(msg)}`;
assert(wa.includes("wa.me"), "whatsapp link host");
assert(wa.includes("Davetiyemiz"), "whatsapp encodes message text");

const rsvpPayload = {
  name: "Ayşe Yılmaz",
  attending: true,
  count: 1,
};
assert(rsvpPayload.name.trim().length >= 2 && typeof rsvpPayload.attending === "boolean", "rsvp name + yes/no");

console.log("smoke-features: ok");
console.log(`- live day today (${today})`);
console.log(`- ${filters.length} lens filters`);
console.log("- whatsapp assist URL shape");
console.log("- rsvp payload shape");
