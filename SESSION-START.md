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
Phase 2: BaseTableComponent Implementation (IN PROGRESS)
├── ✅ Phase 1: Foundation Complete
│   ├── ✅ Angular 14 project bootstrapped
│   ├── ✅ PrimeNG installed
│   ├── ✅ UrlStateService implemented
│   ├── ✅ BroadcastChannelService implemented
│   ├── ✅ Routing infrastructure complete
│   ├── ✅ Demo data infrastructure (validated against Elasticsearch)
│   └── ✅ DemoApiService with filtering/sorting/pagination
│
└── ⏳ Phase 2: BaseTableComponent (CURRENT)
    ├── ✅ Item 1: Demo data created (frontend/src/app/demo/)
    ├── ⏳ Item 2: Create BaseTableComponent (IN PROGRESS)
    ├── ⏳ Item 3: Create sample picker configuration
    ├── ⏳ Item 4: Create sample results table configuration
    ├── ⏳ Item 5: Create sample expandable table configuration
    └── ⏳ Item 6: Create test page demonstrating all variants
```

---

## Key Documents

1. **[GOALS.md](GOALS.md)** - Project goals and requirements (READ THIS FIRST)
2. **[ANALYSIS.md](ANALYSIS.md)** - Comprehensive codebase analysis (READ THIS SECOND)
3. **[PICKER-CHECKBOX-BEHAVIOR.md](PICKER-CHECKBOX-BEHAVIOR.md)** - Tri-state checkbox specification
4. **[PROJECT-OVERVIEW.md](PROJECT-OVERVIEW.md)** - API, tech stack, workflow
5. **[URL-STATE-ARCHITECTURE-ANALYSIS.md](URL-STATE-ARCHITECTURE-ANALYSIS.md)** - What NOT to copy from apn
6. **[STATE-MANAGEMENT-DRAFT.md](STATE-MANAGEMENT-DRAFT.md)** - URL-first patterns

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

## Learning Goals (URL-First Architecture)

### Goal 1: URL-First Architecture Understanding
**Desired Outcome:** Developer gains clear understanding through hands-on implementation

**Key Concepts to Master:**
1. ✅ Dumb components receive state via @Input, emit events via @Output (never touch URL)
2. ✅ Smart parent components hydrate from UrlStateService, update URL on events
3. ⏳ "Start Wide, Go Narrow" pattern for paginated tables
   - Initial broad search fetches all matches (e.g., ?models=Ford:F-150)
   - Table shows first page, user can narrow with filters
   - Pagination state lives in URL (?page=2&size=20)
4. ⏳ Popped-out components sync via BroadcastChannel
   - Main window URL = single source of truth
   - Pop-out windows listen for state changes, never update their own URL
   - BroadcastChannel broadcasts URL changes to all windows

### Goal 2: Plugin-Based Picker System
**Desired Outcome:** Add new picker with only configuration file (no code changes)

**Configuration Controls:**
- API endpoint (can be different per picker)
- Columns: headers, labels, filterable, sortable, orderable
- First column can be locked (always first, non-draggable)
- Selection mode: single/multi, hierarchical parent-child

### Goal 3: Configurable Results Tables
**Desired Outcome:** Results tables configured like pickers + expandable row support

**Configuration Controls:**
- Same as picker (columns, API, filters, sorting)
- Expandable rows with sub-table configuration
- Sub-table loads data on-demand when row expands

### Goal 4: Base Table Design Decision
**Decision Made:** ✅ Single BaseTableComponent with configuration parameter

- ✅ No separate SimpleTable/ExpandableTable/PickerTable components
- ✅ Picker = BaseTable with selection configuration
- ✅ Expandable = BaseTable with expandable configuration
- ✅ Configuration drives all behavior

---

## Architecture Decisions Made

✅ **Single UrlStateService** (NOT dual services like apn)
✅ **Single BaseTableComponent** (configuration-driven, handles all table types)
✅ **Picker = Table Configuration** (selection column + apply button)
✅ **Expandable rows = Configuration** (not separate component)
✅ **Plugin-based pickers** (add via config file, no code changes)

---

**Last Updated:** 2025-11-11 (Phase 2 in progress)
**Quick Access:** Start with GOALS.md, then ANALYSIS.md, then PICKER-CHECKBOX-BEHAVIOR.md
