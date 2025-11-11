# Session Start Checklist

**Purpose:** Quick reference for starting new Claude sessions or after `/compact`
**Status:** Always read this first!

---

## Critical Reminders

### ⚠️ #1: Container Commands Only

**ALL npm and ng commands MUST run inside dev container, NEVER on Thor server**

```bash
# ❌ WRONG
npm install
ng generate component foo

# ✅ CORRECT
podman exec -it vehicle-discovery-platform-dev npm install
podman exec -it vehicle-discovery-platform-dev ng generate component foo
```

---

## Team Structure

**odin (You):** Project Manager
- Makes all final decisions
- Approves/rejects architectural proposals
- Prioritizes features
- Says "go" when ready to proceed

**Claude (Me):** Master Software Architect
- Proposes solutions with trade-offs
- Drafts ADRs for approval
- Implements approved architecture
- Guides best practices
- Never makes decisions unilaterally

---

## Project Context

**What:** Angular 14 vehicle discovery platform
**Goal:** Reproduce apn functionality with clean PrimeNG implementation
**Approach:** Lean - outcomes over documentation
**Philosophy:** Learn by doing (URL-first architecture, plugin tables)

---

## Current Status

```
Planning Phase
├── ✅ API Discovery (PROJECT-OVERVIEW.md)
├── ✅ Goals Defined (GOALS.md)
├── ✅ Anti-Pattern Analysis (URL-STATE-ARCHITECTURE-ANALYSIS.md)
├── ✅ State Management Patterns (STATE-MANAGEMENT-DRAFT.md)
└── ⏳ Next: First ADRs OR Bootstrap project (awaiting PM decision)
```

---

## Key Documents

1. **[GOALS.md](GOALS.md)** - Project goals and requirements (READ THIS FIRST)
2. **[PROJECT-OVERVIEW.md](PROJECT-OVERVIEW.md)** - API, tech stack, workflow
3. **[URL-STATE-ARCHITECTURE-ANALYSIS.md](URL-STATE-ARCHITECTURE-ANALYSIS.md)** - What NOT to copy from apn
4. **[STATE-MANAGEMENT-DRAFT.md](STATE-MANAGEMENT-DRAFT.md)** - URL-first patterns

---

## Quick Facts

**Port:** 4203 (4200 = AUTOS, 4201 = apn)
**Angular:** 14.2.0 (fixed requirement)
**PrimeNG:** 14.x series
**Node:** 18-alpine (in container)
**Backend API:** `http://localhost:3000/api` (existing, from apn)
**Dev URL:** `http://localhost:4203` or `http://thor:4203`

---

## Development Commands

**Start dev container:**
```bash
podman run -d \
  --name vehicle-discovery-platform-dev \
  --network host \
  -v /home/odin/projects/vehicle-discovery-platform:/app:z \
  -w /app \
  localhost/vehicle-discovery-platform:dev
```

**Start dev server:**
```bash
podman exec -it vehicle-discovery-platform-dev npm start -- --host 0.0.0.0 --port 4203
```

**Run Angular CLI:**
```bash
podman exec -it vehicle-discovery-platform-dev ng [command]
```

**Stop container:**
```bash
podman stop vehicle-discovery-platform-dev
podman rm vehicle-discovery-platform-dev
```

---

## Next Actions (Awaiting PM Decision)

**Option 1:** Draft ADRs (5 foundational decisions)
**Option 2:** Bootstrap project (`ng new` + install deps)
**Option 3:** Both (ADRs first, then bootstrap)

---

## Architecture Decisions Made

✅ **Single UrlStateService** (NOT dual services like apn)
✅ **Single BaseTableComponent** (configuration-driven, handles all table types)
✅ **Picker = Table Configuration** (selection column + apply button)
✅ **Expandable rows = Configuration** (not separate component)
✅ **Plugin-based pickers** (add via config file, no code changes)

---

**Last Updated:** 2025-11-11
**Quick Access:** Start with GOALS.md, then PROJECT-OVERVIEW.md
