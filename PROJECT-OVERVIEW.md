# Vehicle Discovery Platform - Project Overview

**Document Status:** Initial Planning
**Date Created:** 2025-11-11
**Repository:** `~/projects/vehicle-discovery-platform`
**Branch:** master (initial)

---

## Executive Summary

This project will build a **production-grade Angular v14 frontend web application** from scratch using an **Architecture Decision Record (ADR) driven development approach**. The application will connect to an existing backend API to provide vehicle discovery and exploration capabilities.

---

## Project Context

### What We're Building
A complete Angular v14 single-page application (SPA) that **reproduces the functionality of the AUTOS-PrimeNG (apn) project**, specifically:
- Vehicle search and discovery interface
- Manufacturer/Model picker with multi-select capability
- Results table with expandable VIN instances
- Advanced filtering (year range, body class, data source)
- Table customization (column reorder, visibility, sorting, pagination)
- Workshop page with drag-and-drop customizable layout
- Panel pop-out feature for multi-monitor workflows
- URL-driven state management (bookmarkable, shareable)

### What Makes This Different
Unlike the apn project which is **migrating from NG-ZORRO to PrimeNG**, this project will:
1. **Start fresh with PrimeNG from day one** - No legacy UI library migration needed
2. **Use ADR-driven development** - Every architectural decision documented before implementation
3. **Build production-grade architecture** - Enterprise patterns from the beginning
4. **Learn from apn's proven patterns** - Adopt successful state management and component patterns

This creates a living history of:
- Why we chose specific approaches
- What alternatives we considered
- What trade-offs we accepted
- What context influenced each decision

---

## Team Structure

**Client Role:** Project Manager + Lead Developer (you)
- Defines requirements and priorities
- Reviews and approves architectural decisions
- Implements code based on approved ADRs
- Has final authority on all decisions

**My Role:** Master Software Architect + Development Guide (AI assistant)
- Proposes architectural solutions with ADRs
- Explains trade-offs and alternatives
- Guides implementation decisions
- Provides code examples and patterns
- Never implements without approval

---

## What Are Architecture Decision Records (ADRs)?

### Definition
An ADR is a document that captures an important architectural decision along with its context and consequences. Each ADR describes:
1. **Context:** What situation are we facing?
2. **Decision:** What did we decide to do?
3. **Consequences:** What are the results (both positive and negative)?

### ADR Structure (Simplified Format)
```markdown
# ADR-NNN: [Decision Title]

**Status:** [Proposed | Accepted | Deprecated | Superseded]
**Date:** YYYY-MM-DD
**Deciders:** [Who made this decision]

## Context
[Describe the situation, constraints, and forces at play]

## Decision
[The change we're proposing or making]

## Consequences
### Positive
- [Benefit 1]
- [Benefit 2]

### Negative
- [Trade-off 1]
- [Trade-off 2]

### Neutral
- [Implication 1]
- [Implication 2]

## Alternatives Considered
1. **[Alternative 1]:** [Why we didn't choose it]
2. **[Alternative 2]:** [Why we didn't choose it]
```

### ADR Workflow in This Project
1. **Identify Decision Point** - Recognize when an architectural choice is needed
2. **Draft ADR** - I propose a solution with full context and alternatives
3. **Review & Discuss** - You review, ask questions, suggest changes
4. **Accept or Revise** - You accept the ADR or ask for revisions
5. **Implement** - Code is written based on the accepted ADR
6. **Commit Together** - ADR and implementation code are committed together

---

## Development Approach

### Phase-Based Development
We'll build this application in phases, with each phase containing:
- One or more ADRs for architectural decisions
- Implementation of features based on accepted ADRs
- Testing and validation
- Documentation updates

### Typical Phase Flow
1. **Requirements Discussion** - You describe what you need
2. **ADR Proposal** - I draft ADR(s) for architectural decisions
3. **Decision Review** - We discuss trade-offs and alternatives
4. **Implementation** - You implement (or I guide implementation) based on accepted ADRs
5. **Validation** - Verify the solution works as intended
6. **Documentation** - Update related docs, commit ADRs with code

### ADR Numbering Convention
- `ADR-001`, `ADR-002`, etc. (sequential)
- Each ADR gets a unique number
- Numbers are never reused
- Deprecated ADRs remain in the repository for historical context

---

## Backend API (Existing - From apn Project)

### API Overview
**Base URL:** `http://autos-prime-ng.minilab/api` (production) or `http://localhost:3000` (dev)
**Technology:** Node.js + Express.js
**Data Store:** Elasticsearch (autos-unified index, ~100,000 vehicle records)
**Authentication:** None (internal use)

### Endpoints

#### 1. GET /api/search/manufacturer-model-counts
**Purpose:** Retrieve hierarchical list of all manufacturers and their models with counts

**Query Parameters:** None

**Response:**
```json
{
  "manufacturers": [
    {
      "manufacturer": "Ford",
      "models": [
        { "model": "F-150", "count": 1523 },
        { "model": "Mustang", "count": 892 }
      ]
    }
  ]
}
```

#### 2. GET /api/search/vehicle-details
**Purpose:** Search and filter vehicle records with pagination and sorting

**Query Parameters:**
- `models` (required): "Ford:F-150,Chevrolet:Corvette" (comma-separated manufacturer:model pairs)
- `page` (required): 1-indexed page number
- `size` (required): Results per page (10, 20, 50, 100)
- `manufacturer` (optional): Filter by manufacturer
- `model` (optional): Filter by model
- `yearMin` (optional): Minimum year
- `yearMax` (optional): Maximum year
- `bodyClass` (optional): Filter by body class
- `dataSource` (optional): Filter by data source
- `sortBy` (optional): Column key to sort by
- `sortOrder` (optional): 'asc' or 'desc'

**Response:**
```json
{
  "results": [
    {
      "vehicle_id": "unique-hash",
      "manufacturer": "Ford",
      "model": "F-150",
      "year": 2020,
      "body_class": "Pickup",
      "data_source": "NHTSA",
      "make_model_year": "Ford|F-150|2020",
      "instance_count": 25000
    }
  ],
  "total": 4887,
  "page": 1,
  "size": 20,
  "totalPages": 245
}
```

#### 3. GET /api/search/vehicle-instances/:vehicleId
**Purpose:** Generate VIN instances for a specific vehicle on-demand

**Path Parameters:**
- `vehicleId`: Vehicle identifier

**Query Parameters:**
- `count` (optional): Number of VINs to generate (default: 5, max: 100)

**Response:**
```json
{
  "vehicle_id": "unique-hash",
  "instances": [
    {
      "vin": "1FTFW1E84MFA12345",
      "state": "CA",
      "color": "Blue",
      "value": 45000,
      "condition": "Excellent",
      "mileage": 12500
    }
  ]
}
```

### Data Models

#### Vehicle Record (Elasticsearch Document)
```typescript
interface VehicleRecord {
  manufacturer: string;
  model: string;
  year: number;
  body_class: string;
  data_source: string;
  vehicle_id: string;
  make_model_year: string;  // Composite key: "Manufacturer|Model|Year"
  instance_count: number;    // VIN count (computed from autos-vins index)
}
```

#### VIN Instance (Generated On-Demand)
```typescript
interface VehicleInstance {
  vin: string;              // Generated, not stored
  state: string;            // Geographic weighting (CA 15%, TX 8%, FL 7%, etc.)
  color: string;            // Period-appropriate palettes
  value: number;            // Calculated from condition + mileage + options
  condition: string;
  mileage: number;
}
```

### Key Characteristics
- **No Authentication Required** - Internal API, no auth headers needed
- **VINs Generated On-Demand** - Not stored in database, created per request
- **Client-Side VIN Count Sorting** - `instance_count` computed after main query (known limitation)
- **Pagination Support** - Server-side pagination for vehicle-details endpoint
- **Filter Combination** - Multiple filters can be combined in single request

---

## State Management Architecture (From apn)

The apn project uses a **URL-as-single-source-of-truth** architecture that we will reproduce:

### Core Principles

1. **URL Query Parameters = Application State**
   - All search filters, sort order, pagination state lives in the URL
   - Components hydrate from URL on initialization
   - State changes update URL, triggering re-hydration
   - Supports bookmarking, sharing, browser back/forward navigation

2. **Two Storage Layers**
   - **URL (Query State)** - Shareable, bookmarkable
     - Selected manufacturer/model combinations
     - Active filters (year range, body class, data source)
     - Sort column and direction
     - Current page and page size
   - **localStorage (UI Preferences)** - Per-browser, not shareable
     - Column order (user's custom arrangement)
     - Column visibility (which columns shown/hidden)
     - Default page size preference
     - Panel collapse states

### Key Services (To Be Implemented)

1. **RouteStateService**
   - Low-level URL query parameter management
   - Read/write individual query params
   - Type-safe parameter parsing

2. **StateManagementService**
   - High-level business logic coordinator
   - Triggers API calls when state changes
   - Manages filter state and synchronization
   - Emits state changes via RxJS observables

3. **RequestCoordinatorService**
   - Request deduplication (prevents duplicate API calls)
   - Response caching (improves performance)
   - Retry logic with exponential backoff
   - Loading state coordination

4. **TableStatePersistenceService**
   - localStorage management for table UI preferences
   - Column order and visibility persistence
   - Per-table configuration support

### State Flow Example

**User Interaction → URL Update:**
```
1. User selects "Ford:F-150" in picker
2. Component emits event to parent
3. Parent calls StateManagementService.updateFilters({ models: ['Ford:F-150'] })
4. StateManagementService updates URL (?models=Ford:F-150)
5. StateManagementService triggers API call
6. RequestCoordinatorService deduplicates/caches request
7. URL change triggers component re-hydration
```

**URL → Component Hydration:**
```
1. User navigates to URL with query params (?models=Ford:F-150&page=2)
2. RouteStateService.getQueryParam('models') reads URL
3. StateManagementService.filters$ emits current state
4. Component subscribes and hydrates from state
5. Component displays UI based on state
```

---

## Core Features (To Be Reproduced)

### 1. Discover Page
**Route:** `/discover`
**Purpose:** Main vehicle search and discovery interface

**Components:**
- **Manufacturer/Model Picker**
  - Hierarchical display of manufacturers → models
  - Multi-select capability (select multiple manufacturer:model combinations)
  - Live count display (shows how many vehicles match each model)
  - Emits selected combinations to parent

- **Vehicle Results Table**
  - Displays search results with pagination
  - Sortable columns (manufacturer, model, year, body class, data source, VIN count)
  - Filterable (year range, body class, data source)
  - Expandable rows (click to show VIN instances)
  - Column customization (reorder, show/hide columns)

### 2. Workshop Page
**Route:** `/workshop`
**Purpose:** Drag-and-drop customizable workspace

**Features:**
- Grid-based layout system (12-column grid)
- Draggable/resizable panels
- Same components as Discover page (Picker + Results)
- Layout persistence to localStorage
- Panel collapse/expand states

### 3. Panel Pop-Out Feature
**Purpose:** Multi-monitor workflow support

**Functionality:**
- Pop out any panel into separate browser window
- MOVE semantics (panel removed from main window when popped out)
- Bidirectional state synchronization via BroadcastChannel
- Main window remains single source of truth
- Automatic panel restoration when pop-out closes

### 4. Table Features
**Column Customization:**
- Drag-and-drop column reordering
- Column visibility toggle (show/hide)
- Persistence to localStorage per table

**Data Operations:**
- Server-side sorting (most columns)
- Client-side sorting (VIN count - known limitation)
- Server-side pagination
- Filtering with multiple criteria

---

## Technology Stack (Planned)

### Core Framework
- **Angular:** 14.2.0 (matching apn version)
- **Angular CLI:** @angular/cli@14
- **TypeScript:** 4.7.x (compatible with Angular 14)
- **Node.js:** 18.x (for development server)
- **Package Manager:** npm

### UI Library
- **PrimeNG:** 14.x series (compatible with Angular 14.2.0)
- **PrimeIcons:** Icon library for PrimeNG
- **PrimeFlex:** Utility CSS library (optional)

### Layout & Drag-Drop
- **@katoid/angular-grid-layout:** Grid layout for Workshop page
- **@angular/cdk/drag-drop:** Column reordering

### State Management
- **RxJS:** Reactive state management
- **Angular Router:** URL-driven state

### Development Tools
- **VS Code:** Primary IDE
- **Chrome DevTools:** Debugging
- **Angular DevTools:** Component inspection

### Differences from apn
- **Start with PrimeNG** (apn is migrating from NG-ZORRO)
- **No NG-ZORRO dependency** (clean start)
- **ADR-driven development** (documented decision-making)
- **Clean directory structure** (apn's structure is ad-hoc and malformed)

---

## Development Workflow

### Development Container Approach
We will use the same containerized development workflow as apn:

**⚠️ CRITICAL: ALL npm and ng commands MUST run inside the dev container, NEVER on Thor server**

```bash
# ❌ WRONG: Running on Thor server
npm install  # DON'T DO THIS
ng generate component my-component  # DON'T DO THIS

# ✅ CORRECT: Running inside dev container
podman exec -it vehicle-discovery-platform-dev npm install
podman exec -it vehicle-discovery-platform-dev ng generate component my-component
```

**Dev Container Configuration:**
- **Base Image:** node:18-alpine
- **Port:** 4203 (4200 = original AUTOS, 4201 = apn)
- **Volume Mount:** Project directory mounted with `:z` flag (SELinux compatibility)
- **Network:** `--network host` (access backend at localhost:3000)
- **Features:** Hot Module Reload (HMR), live compilation
- **Working Directory:** /app

**Docker Files:**
- `Dockerfile.dev` - Development image with Angular CLI and development tools
- `Dockerfile.prod` - Production multi-stage build (node:18-alpine → nginx:alpine)

### Daily Development Cycle

**Start Development Session:**
```bash
# 1. Build dev image (first time or after Dockerfile.dev changes)
cd /home/odin/projects/vehicle-discovery-platform
podman build -f Dockerfile.dev -t localhost/vehicle-discovery-platform:dev .

# 2. Start dev container
podman run -d \
  --name vehicle-discovery-platform-dev \
  --network host \
  -v /home/odin/projects/vehicle-discovery-platform:/app:z \
  -w /app \
  localhost/vehicle-discovery-platform:dev

# 3. Start Angular dev server
podman exec -it vehicle-discovery-platform-dev npm start -- --host 0.0.0.0 --port 4203

# 4. Access at http://localhost:4203 or http://thor:4203
```

**During Development:**
- Edit files in VS Code (Remote-SSH to Thor)
- Watch terminal for automatic recompilation
- Changes reflect immediately via HMR
- Test at http://localhost:4203

**End Development Session:**
```bash
# Stop dev server: Ctrl+C in terminal

# Optional: Stop and remove container
podman stop vehicle-discovery-platform-dev
podman rm vehicle-discovery-platform-dev
```

### Production Build & Deploy (Future)

**When ready to deploy to Kubernetes:**
```bash
# 1. Build production image
cd /home/odin/projects/vehicle-discovery-platform
podman build -f Dockerfile.prod -t localhost/vehicle-discovery-platform:prod .

# 2. Export to tar
podman save localhost/vehicle-discovery-platform:prod -o vehicle-discovery-platform-prod.tar

# 3. Import to K3s
sudo k3s ctr images import vehicle-discovery-platform-prod.tar

# 4. Deploy to Kubernetes (deployment manifests TBD)
kubectl apply -f k8s/frontend-deployment.yaml

# 5. Verify deployment
kubectl rollout status deployment/vehicle-discovery-platform -n [namespace]
```

### Environment Configuration

**Development (environment.ts):**
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api'  // Backend in K8s, accessible via host network
};
```

**Production (environment.prod.ts):**
```typescript
export const environment = {
  production: true,
  apiUrl: '/api'  // Proxied through nginx ingress
};
```

### Key Workflow Principles (From apn)

1. **SELinux Compatibility:** Always use `:z` flag on volume mounts
2. **Network Access:** Use `--network host` for dev container to access backend
3. **Port Isolation:** Each project gets unique port (4203 for this project)
4. **HMR Workflow:** Edit → Save → Auto-reload (seconds, not minutes)
5. **Container Lifecycle:** Start container, exec into it, run dev server
6. **Image Stores:** Podman (user-level) vs K3s containerd (system-level, requires sudo)

---

## Initial Project Structure (Planned)

```
vehicle-discovery-platform/
├── docs/
│   ├── adr/                    # Architecture Decision Records
│   │   ├── 0001-angular-version.md
│   │   ├── 0002-state-management.md
│   │   └── ...
│   ├── api/                    # API documentation
│   └── guides/                 # Development guides
├── src/
│   └── [Angular application code - to be created]
├── PROJECT-OVERVIEW.md         # This document
└── README.md                   # Standard project README
```

---

## Success Criteria

This project will be considered successful when:
1. ✅ Every major architectural decision is documented in an ADR
2. ✅ The application successfully retrieves and displays data from the API
3. ✅ All core features are implemented with clean, maintainable code
4. ✅ The codebase follows Angular best practices
5. ✅ Future developers can understand why decisions were made by reading ADRs

---

## Project Goals

**📄 See [GOALS.md](GOALS.md) for complete requirements and desired outcomes**

### Quick Summary

**Goal 1: Master URL-First Architecture**
- Understand URL as single source of truth
- Handle "dumb" components that hydrate from URL
- Implement "Start Wide, Go Narrow" pattern for paginated tables
- Sync popped-out components with main window via BroadcastChannel

**Goal 2: Plugin-Based Picker System**
- Add new pickers via configuration file only (no code changes)
- Support disparate APIs (each picker can use different endpoint)
- Configure columns (headers, filterable, sortable, orderable, locked)

**Goal 3: Configurable Results Tables**
- Configure tables like pickers (via config file)
- Support expandable rows with sub-tables
- Sub-table data fetched on-demand

**Goal 4: Base Table Design**
- ✅ **Decision: Single `BaseTableComponent` with configuration**
- No separate SimpleTable/ExpandableTable/PickerTable components
- Picker is table configuration (selection column + apply button)
- Expandable rows controlled by configuration

---

## Next Steps

### Phase 1: Foundation (Current)
1. ✅ **API Discovery** - COMPLETE (documented above)
2. ✅ **Goals Defined** - COMPLETE (see GOALS.md)
3. **First ADRs** - Document foundational decisions
   - ADR-001: Project initialization and Angular setup
   - ADR-002: UI library selection (PrimeNG)
   - ADR-003: Development environment and workflow
   - ADR-004: URL state management architecture (single service)
   - ADR-005: Base table component design

4. **Bootstrap Project** - Initialize Angular application
   - Run `ng new` with appropriate configuration
   - Set up dev container workflow (port 4203)
   - Install necessary dependencies (PrimeNG, etc.)
   - Create initial project structure

---

## Development Principles

### ADR-First Development
- **Before coding:** Write an ADR for any architectural choice
- **Before changing architecture:** Write an ADR documenting the change
- **When deprecated:** Mark old ADRs as superseded, link to new ADR

### Clean Code Practices
- Follow Angular style guide
- Write self-documenting code with clear names
- Keep components focused and small
- Test critical business logic

### Pragmatic Over Perfect
- ADRs should be helpful, not bureaucratic
- Not every tiny decision needs an ADR (e.g., variable names)
- ADRs are for architectural and structural decisions
- Use judgment to decide what warrants an ADR

---

## Communication Protocol

### Decision-Making
1. I propose solutions with ADRs
2. You have final decision authority
3. We discuss alternatives openly
4. You approve before implementation proceeds

### Code Implementation
1. I can provide code examples and patterns
2. You review and decide what to use
3. You implement or I guide implementation
4. Code is committed with related ADRs

### Questions and Clarifications
- Ask questions anytime
- Challenge my proposals
- Suggest alternative approaches
- Request additional analysis

---

## Reference Materials

### ADR Resources
- [ADR GitHub](https://adr.github.io/) - ADR organization and examples
- [Michael Nygard's Article](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions) - Original ADR concept
- [ADR Tools](https://github.com/npryce/adr-tools) - Command-line tools for managing ADRs

### Angular v14 Resources
- [Angular 14 Documentation](https://v14.angular.io/docs)
- [Angular Style Guide](https://angular.io/guide/styleguide)
- [RxJS Documentation](https://rxjs.dev/)

---

## Ready to Begin

This document establishes our shared understanding of:
- **What we're building:** Angular v14 frontend reproducing apn functionality with PrimeNG
- **How we're building it:** ADR-driven development with containerized workflow
- **Who does what:** You decide (Project Manager), I guide (Architect)
- **Why we're doing it this way:** Maintainability, learning, documentation, clean architecture
- **What we're NOT doing:** Copying apn's malformed directory structure

### Current Status
✅ **API Discovery Complete** - All endpoints, data models, and characteristics documented
✅ **Development Workflow Defined** - Container-based HMR workflow with port 4203
✅ **Technology Stack Planned** - Angular 14.2.0 + PrimeNG 14.x + proven state management patterns
✅ **Features Identified** - Discover page, Workshop page, pop-out panels, table customization

### Next Actions
**When you're ready to start, we'll:**
1. **Draft first ADRs** (project setup, UI library, dev workflow, state management, structure)
2. **Initialize Angular project** with `ng new`
3. **Set up dev container** with Dockerfile.dev
4. **Install PrimeNG** and core dependencies
5. **Create project structure** (clean, well-organized)

---

**Document Owner:** Claude (Master Software Architect)
**Approved By:** odin (Project Manager)
**Last Updated:** 2025-11-11
**Status:** Planning Phase - Ready to Begin Development
