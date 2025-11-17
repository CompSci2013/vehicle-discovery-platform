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
Phase 5: Integration & Polish (IN PROGRESS - Component Migration Needed)
├── ✅ Phase 1: Foundation Complete
│   ├── ✅ Angular 14 project bootstrapped with PrimeNG
│   ├── ✅ UrlStateService implemented (URL-first architecture)
│   ├── ✅ BroadcastChannelService implemented (configurable)
│   ├── ✅ RequestCoordinatorService (deduplication)
│   ├── ✅ Routing infrastructure complete
│   └── ✅ Demo data infrastructure
│
├── ✅ Phase 2: BaseTableComponent Complete
│   ├── ✅ Configuration-driven BaseTableComponent
│   ├── ✅ Sort, filter, pagination support
│   ├── ✅ URL state integration
│   └── ✅ Demo configurations created
│
├── ✅ Phase 3: Column Management Complete
│   ├── ✅ Column reordering (drag-and-drop)
│   ├── ✅ Column visibility toggles
│   ├── ✅ Column manager component
│   └── ✅ URL state persistence for column config
│
├── ✅ Phase 4: Hierarchical Selection Complete
│   ├── ✅ Parent-child selection patterns
│   ├── ✅ Single-column picker mode
│   ├── ✅ Dual-column picker mode
│   ├── ✅ Binary checkbox states (no indeterminate)
│   └── ✅ URL state persistence for selections
│
├── ✅ Phase 5: Generic Services Architecture (JUST COMPLETED)
│   ├── ✅ ApiService refactored to be 100% generic
│   ├── ✅ BroadcastChannelService made configurable
│   ├── ✅ API configuration interfaces created
│   ├── ✅ Vehicle API configuration implemented
│   ├── ✅ All table configs updated with apiConfigRef
│   └── ✅ Documentation: GENERIC_SERVICES_REFACTORING.md
│
└── ⏳ Phase 5: Integration Testing (CURRENT - NEXT TASK)
    ├── ⚠️ BLOCKED: Components need migration to new API first
    ├── ⏳ Step 5.1: Test Sort + Hierarchical Selection
    ├── ⏳ Step 5.2: Test Filter + Hierarchical Selection
    ├── ⏳ Step 5.3: Test Column Reordering
    ├── ⏳ Step 5.4: Test Pagination + Selection
    └── ⏳ Step 5.5: Test URL State Consistency
```

**IMMEDIATE NEXT STEP:**
Update components to use new generic API service before proceeding with integration tests.
Components using old methods (getManufacturerModelCounts, searchVehicles, getVinInstances)
must be migrated to use new configuration-driven API.

---

## Key Documents

**Essential Reading:**
1. **[GOALS.md](GOALS.md)** - Project goals and requirements (READ THIS FIRST)
2. **[ANALYSIS.md](ANALYSIS.md)** - Comprehensive codebase analysis (READ THIS SECOND)
3. **[SESSION-START.md](SESSION-START.md)** - This document (always start here)

**Architecture & Design:**
4. **[GENERIC_SERVICES_REFACTORING.md](GENERIC_SERVICES_REFACTORING.md)** - Generic API architecture (NEW!)
5. **[URL-STATE-ARCHITECTURE-ANALYSIS.md](URL-STATE-ARCHITECTURE-ANALYSIS.md)** - What NOT to copy from apn
6. **[STATE-MANAGEMENT-DRAFT.md](STATE-MANAGEMENT-DRAFT.md)** - URL-first patterns
7. **[PICKER-CHECKBOX-BEHAVIOR.md](PICKER-CHECKBOX-BEHAVIOR.md)** - Checkbox specification

**Phase Documentation:**
8. **[PHASE-5-PROGRESS.md](PHASE-5-PROGRESS.md)** - Current phase progress tracking
9. **[PHASE-5-INTEGRATION-ISSUES.md](PHASE-5-INTEGRATION-ISSUES.md)** - Known issues and fixes
10. **[PHASE-5-PLAN.md](PHASE-5-PLAN.md)** - Integration testing plan

**Reference:**
11. **[PROJECT-OVERVIEW.md](PROJECT-OVERVIEW.md)** - API, tech stack, workflow

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
✅ **Generic Services Architecture** (NEW - Nov 2025)
   - ApiService: 100% generic, configuration-driven
   - BroadcastChannelService: Configurable channel name
   - All domain logic in config files (config/api/)
   - Type-safe via TypeScript generics
   - Zero hardcoded endpoints or domain types

---

## Recent Major Changes

**Nov 17, 2025 - Generic Services Refactoring (Commit d669658)**
- All services refactored to be domain-agnostic
- Created API configuration architecture (ApiConfig, ApiEndpointConfig)
- Moved all vehicle types to config/api/vehicle-api.types.ts
- Moved all API endpoints to config/api/vehicle-api.config.ts
- Updated all table configs with apiConfigRef
- **BREAKING CHANGE:** Components must migrate to new API
- See GENERIC_SERVICES_REFACTORING.md for migration guide

---

**Last Updated:** 2025-11-17 (Phase 5 - Generic Services complete, Component migration needed)
**Quick Access:** SESSION-START.md → GENERIC_SERVICES_REFACTORING.md → PHASE-5-PROGRESS.md
