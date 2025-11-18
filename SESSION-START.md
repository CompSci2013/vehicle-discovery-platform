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
Phase 6: Sub-Table Expansion (COMPLETE ✅)
├── ✅ Phase 1: Foundation Complete & Verified
│   ├── ✅ Angular 14 project bootstrapped with PrimeNG
│   ├── ✅ UrlStateService implemented (URL-first architecture)
│   ├── ✅ BroadcastChannelService implemented (configurable)
│   ├── ✅ RequestCoordinatorService (deduplication)
│   ├── ✅ Routing infrastructure complete
│   └── ✅ Demo data infrastructure
│
├── ✅ Phase 2: BaseTableComponent Complete & Verified
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
├── ✅ Phase 4: Hierarchical Selection Complete & Verified
│   ├── ✅ Parent-child selection patterns
│   ├── ✅ Single-column picker mode
│   ├── ✅ Dual-column picker mode
│   ├── ✅ Binary checkbox states (no indeterminate)
│   └── ✅ URL state persistence for selections
│
├── ✅ Phase 5: Generic Services Architecture COMPLETE
│   ├── ✅ ApiService refactored to be 100% generic
│   ├── ✅ BroadcastChannelService made configurable
│   ├── ✅ API configuration interfaces created
│   ├── ✅ Vehicle API configuration implemented
│   ├── ✅ All table configs updated with apiConfigRef
│   ├── ✅ Component migration verified (no migration needed!)
│   ├── ✅ Documentation: GENERIC_SERVICES_REFACTORING.md
│   └── ✅ Phase 5: Integration Testing (SUBSTANTIALLY COMPLETE)
│       ├── ✅ Step 5.1: Sort + Hierarchical Selection TESTED & PASSING
│       ├── ✅ Step 5.2: Filter + Hierarchical Selection TESTED & PASSING
│       │   └── ✅ Critical bug fix verified: Parent state reflects visible children
│       ├── ⏳ Step 5.3: Column Reordering (not tested - non-critical)
│       ├── ⏳ Step 5.4: Pagination + Selection (demo data has no pagination)
│       └── ✅ Step 5.5: URL State Consistency TESTED & PASSING
│           └── ✅ Full state restoration verified (sort + filter + selection)
│
└── ✅ Phase 6: Sub-Table Expansion (Expandable Rows) COMPLETE
    ├── ✅ Step 6.1: Expandable row template restored to BaseTableComponent
    │   ├── ✅ Expand/collapse icons added to all 3 table modes
    │   ├── ✅ Recursive BaseTable rendering for sub-tables
    │   └── ✅ Compact sub-table styling
    ├── ⏳ Step 6.2: API loading for sub-tables (DEFERRED - static data sufficient)
    ├── ✅ Step 6.3: Expandable demo configuration created
    │   ├── ✅ EXPANDABLE_DEMO_CONFIG with static VIN data
    │   ├── ✅ DemoApiService enhanced with VIN instances
    │   └── ✅ Demo page updated with expandable section
    ├── ✅ Step 6.4: Integration testing (6 tests, 6 passed)
    │   ├── ✅ Expandable demo section displays
    │   ├── ✅ Vehicle data loads with expand icons
    │   ├── ✅ Single row expansion works
    │   ├── ✅ Row collapse works
    │   ├── ✅ Multiple rows expand simultaneously
    │   └── ✅ Sub-table data integrity verified
    └── ✅ Step 6.5: Documentation updated
        └── ✅ PHASE-6-PLAN.md, SESSION-START.md updated
```

**STATUS: Phase 6 Complete - All Core Table Features Implemented! ✅**

All core BaseTableComponent functionality complete:
- ✅ Configuration-driven architecture
- ✅ URL-first state management
- ✅ Hierarchical selection (picker modes)
- ✅ Expandable rows (sub-tables)
- ✅ Generic API integration

Demo page accessible at http://192.168.0.244:4203/demo

---

## Phase 5 Integration Test Results (Nov 17, 2025)

**8 Tests Conducted - 8 Passed ✅**

| Test | Feature Tested | Result |
|------|----------------|--------|
| 1.0 | Demo navigation link | ✅ PASS |
| 1.1 | Demo page loads with tables | ✅ PASS |
| 2.0 | Basic checkbox selection | ✅ PASS |
| 2.1 | Parent checkbox (hierarchical) | ✅ PASS |
| 3.0 | **Sort + Selection (Phase 5.1)** | ✅ **PASS** |
| 4.0 | **Filter + Selection (Phase 5.2)** | ✅ **PASS** |
| 4.1 | **Parent state bug fix** | ✅ **PASS** |
| 5.0 | **URL State Consistency (Phase 5.5)** | ✅ **PASS** |

**Key Findings:**
- ✅ URL-first architecture working perfectly
- ✅ Multi-feature integration (sort + filter + selection) seamless
- ✅ Parent checkbox bug fix verified working
- ✅ Full state restoration on page refresh
- ✅ No component migration needed (breaking changes had zero impact)

---

## Phase 6 Integration Test Results (Nov 17, 2025)

**6 Tests Conducted - 6 Passed ✅**

| Test | Feature Tested | Result |
|------|----------------|--------|
| 6.1 | Expandable demo section appears | ✅ PASS |
| 6.2 | Vehicle data loads with expand icons | ✅ PASS |
| 6.3 | Single row expansion (chevron icon) | ✅ PASS |
| 6.4 | Row collapse functionality | ✅ PASS |
| 6.5 | Multiple rows expand simultaneously | ✅ PASS |
| 6.6 | Sub-table data integrity (VIN prefixes correct) | ✅ PASS |

**Key Findings:**
- ✅ Recursive BaseTable rendering works perfectly
- ✅ Expand/collapse icons toggle correctly (▶ ↔ ▼)
- ✅ Sub-tables display 7 columns (VIN, State, Color, Value, Mileage, Condition, Title)
- ✅ Static data expansion working (dataKey: 'vin_instances')
- ✅ Multiple expanded rows maintained independently
- ✅ VIN data correct for each manufacturer (Ford: 1FT..., Chevrolet: 1G1..., Toyota: 4T1...)
- ✅ Session-only expansion state (not URL-persisted, as intended)

**Deferred:**
- ⏳ API loading for sub-tables (DEFERRED - static data sufficient for current needs)

---

## Key Documents

**Essential Reading:**
1. **[GOALS.md](GOALS.md)** - Project goals and requirements (READ THIS FIRST)
2. **[ANALYSIS.md](ANALYSIS.md)** - Comprehensive codebase analysis (READ THIS SECOND)
3. **[SESSION-START.md](SESSION-START.md)** - This document (always start here)

**Architecture & Design:**
4. **[GENERIC_SERVICES_REFACTORING.md](GENERIC_SERVICES_REFACTORING.md)** - Generic API architecture
5. **[URL-STATE-ARCHITECTURE-ANALYSIS.md](URL-STATE-ARCHITECTURE-ANALYSIS.md)** - What NOT to copy from apn
6. **[STATE-MANAGEMENT-DRAFT.md](STATE-MANAGEMENT-DRAFT.md)** - URL-first patterns
7. **[PICKER-CHECKBOX-BEHAVIOR.md](PICKER-CHECKBOX-BEHAVIOR.md)** - Checkbox specification

**Phase Documentation:**
8. **[PHASE-6-PLAN.md](PHASE-6-PLAN.md)** - Phase 6: Sub-Table Expansion (COMPLETE)
9. **[PHASE-5-PROGRESS.md](PHASE-5-PROGRESS.md)** - Phase 5 progress tracking
10. **[PHASE-5-INTEGRATION-ISSUES.md](PHASE-5-INTEGRATION-ISSUES.md)** - Known issues and fixes
11. **[PHASE-5-PLAN.md](PHASE-5-PLAN.md)** - Phase 5 integration testing plan

**Validation Reports:**
11. **[PHASE-VALIDATION-REPORT.md](PHASE-VALIDATION-REPORT.md)** - Comprehensive phase verification
12. **[COMPONENT-MIGRATION-REPORT.md](COMPONENT-MIGRATION-REPORT.md)** - Migration analysis

**Reference:**
13. **[PROJECT-OVERVIEW.md](PROJECT-OVERVIEW.md)** - API, tech stack, workflow

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

**Nov 17, 2025 - Phase 6: Sub-Table Expansion COMPLETE**
- ✅ Restored expandable row template to BaseTableComponent (all 3 modes)
- ✅ Implemented recursive BaseTable rendering for sub-tables
- ✅ Created EXPANDABLE_DEMO_CONFIG with static VIN data
- ✅ Enhanced DemoApiService with embedded VIN instances
- ✅ Added expandable rows demo section to demo page
- ✅ Conducted integration testing (6 tests, 6 passed)
- ✅ Verified expand/collapse icons, multi-row expansion, data integrity
- ✅ Session-only expansion state (not URL-persisted)
- ⏳ API loading for sub-tables deferred (static data sufficient)
- ✅ Documentation: PHASE-6-PLAN.md updated

**Nov 17, 2025 - Phase 5 Integration Testing COMPLETE**
- ✅ Conducted comprehensive integration testing (8 tests, 8 passed)
- ✅ Verified Sort + Selection integration (Phase 5.1)
- ✅ Verified Filter + Selection integration (Phase 5.2)
- ✅ Verified critical bug fix: Parent checkbox reflects visible children
- ✅ Verified URL state consistency (Phase 5.5)
- ✅ Validated URL-first architecture working end-to-end
- ✅ Added Demo navigation link to app header
- ✅ Created comprehensive validation reports

**Nov 17, 2025 - Generic Services Refactoring (Commit d669658)**
- All services refactored to be domain-agnostic
- Created API configuration architecture (ApiConfig, ApiEndpointConfig)
- Moved all vehicle types to config/api/vehicle-api.types.ts
- Moved all API endpoints to config/api/vehicle-api.config.ts
- Updated all table configs with apiConfigRef
- Verified no component migration needed (zero breaking changes)
- Documentation: GENERIC_SERVICES_REFACTORING.md

---

**Last Updated:** 2025-11-17 (Phase 6 Complete - All Core Table Features Done!)
**Quick Access:** Demo at http://192.168.0.244:4203/demo
**Test Results:** Phase 5: 8/8 passing ✅ | Phase 6: 6/6 passing ✅
