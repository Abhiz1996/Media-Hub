import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const html = await readFile(new URL("../docs/index.html", import.meta.url), "utf8");
const script = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)][0][1]
  .replace(/\s+main\(\);\s*$/, "");

function dashboard(data, response = data) {
  const elements = new Map();
  function element(id) {
    if (!elements.has(id)) {
      const classes = new Set();
      elements.set(id, {
        textContent: "", innerHTML: "", listeners: {},
        classList: {
          toggle(name, enabled) { enabled ? classes.add(name) : classes.delete(name); },
          contains(name) { return classes.has(name); },
        },
        addEventListener(name, handler) { this.listeners[name] = handler; },
      });
    }
    return elements.get(id);
  }
  const timers = [];
  const context = vm.createContext({
    Intl, Date, URL, console, setTimeout: () => {},
    window: { __NEWS_DATA__: data, setInterval(fn, delay) { timers.push({ fn, delay }); } },
    document: {
      getElementById: element, querySelector: element, querySelectorAll: () => [],
    },
    fetch: async () => {
      if (response instanceof Error) throw response;
      return { ok: true, json: async () => response };
    },
  });
  vm.runInContext(script, context);
  return { context, element, timers };
}

function snapshot(generatedAt) {
  return {
    generatedAt, sourceCount: 28, stats: { totalCount: 2 },
    dailyCounts: Array.from({ length: 14 }, (_, i) => ({
      day: `2026-11-${String(i + 7).padStart(2, "0")}`, count: 0,
    })),
    segments: { internationalStartup: [] },
  };
}

test("page load prefers newly fetched data over the cached script", async () => {
  const old = snapshot("2026-11-06T09:31:50Z");
  const fresh = snapshot(new Date().toISOString());
  const app = dashboard(old, fresh);
  await vm.runInContext("main()", app.context);
  assert.equal(vm.runInContext("dashboardData.generatedAt", app.context), fresh.generatedAt);
  assert.equal(app.element(".refresh-tab").classList.contains("is-stale"), false);
});

test("offline fallback remains visible and warns when it is old", async () => {
  const old = snapshot(new Date(Date.now() - 86400000).toISOString());
  const app = dashboard(old, new Error("offline"));
  await vm.runInContext("main()", app.context);
  assert.equal(vm.runInContext("dashboardData.generatedAt", app.context), old.generatedAt);
  assert.equal(app.element(".refresh-tab").classList.contains("is-stale"), true);
});

test("unchanged polling updates an outdated freshness indicator", async () => {
  const old = snapshot(new Date(Date.now() - 86400000).toISOString());
  const app = dashboard(old);
  await vm.runInContext("main()", app.context);
  app.element(".refresh-tab").classList.toggle("is-stale", false);
  await vm.runInContext("pollForUpdates()", app.context);
  assert.equal(app.element(".refresh-tab").classList.contains("is-stale"), true);
  assert.ok(app.timers.some(timer => timer.delay === 60000));
});

test("manual check does not call stale unchanged data latest", async () => {
  const old = snapshot(new Date(Date.now() - 86400000).toISOString());
  const app = dashboard(old);
  await vm.runInContext("main()", app.context);
  const button = app.element("manual-refresh-btn");
  await button.listeners.click.call(button);
  assert.equal(button.textContent, "No newer data");
});

test("the 14-day chart includes both newest days", async () => {
  const app = dashboard(snapshot(new Date().toISOString()));
  await vm.runInContext("main()", app.context);
  const bars = app.element("daily-bars").innerHTML;
  assert.equal((bars.match(/class="bar-row"/g) || []).length, 14);
  assert.ok(bars.includes("2026-11-19"));
  assert.ok(bars.includes("2026-11-20"));
});
