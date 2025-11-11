import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Import the components that routes will display
import { HomeComponent } from './features/home/home.component';
import { SearchComponent } from './features/search/search.component';
import { WorkshopComponent } from './features/workshop/workshop.component';

/**
 * APPLICATION ROUTING CONFIGURATION
 *
 * This file defines all routes (URLs) that users can navigate to in the application.
 * Angular's router maps URLs to components, enabling single-page application (SPA) navigation.
 *
 * Key Concepts:
 * - Route: A URL pattern that maps to a component
 * - Component: The Angular component to display when the route matches
 * - Path: The URL segment after the domain (e.g., 'search' in http://example.com/search)
 * - Children: Nested routes that appear within a parent component
 * - Lazy Loading: Loading modules/components only when needed (future optimization)
 *
 * URL Structure in this app:
 * - ALL application state lives in URL query parameters (?param=value)
 * - Routes define WHICH component displays, not WHAT data to show
 * - Example: /search?models=Ford:F-150&page=2&sort=asc
 *   - Route: /search (determines SearchComponent displays)
 *   - Query params: models, page, sort (determines what data SearchComponent shows)
 *
 * Why URL-first architecture?
 * - Bookmarkable: Users can save exact application state in bookmarks
 * - Shareable: Copy/paste URL to share filters, selections, page with others
 * - Browser navigation: Back/forward buttons work correctly
 * - Deep linking: Direct links to specific data/filters
 */

/**
 * ROUTE DEFINITIONS
 *
 * Array of route objects that Angular router uses to match URLs to components.
 * Order matters: Angular checks routes top-to-bottom, uses first match.
 * More specific routes should come before generic ones.
 */
const routes: Routes = [
  /**
   * HOME ROUTE
   *
   * Path: '' (empty string)
   * URL: http://example.com/ (root)
   *
   * This is the landing page shown when users first visit the application.
   * The empty string '' matches the root URL with no path segments.
   *
   * pathMatch: 'full' is REQUIRED for empty path routes
   * - 'full': Only matches if the ENTIRE URL is exactly ''
   * - Without 'full': Would match ALL URLs (since every URL starts with '')
   *
   * Future implementation:
   * - Will display welcome message
   * - Quick start guide
   * - Navigation cards to Search and Workshop pages
   * - Recent searches (if we add that feature)
   *
   * Component: Will be created as HomeComponent
   */
  {
    path: '',
    component: HomeComponent,  // Landing page
    pathMatch: 'full'
  },

  /**
   * SEARCH ROUTE
   *
   * Path: 'search'
   * URL: http://example.com/search
   *
   * Main vehicle search interface with traditional layout:
   * - Manufacturer/Model picker at top
   * - Search results table below
   * - Filters in sidebar or collapsible panels
   *
   * All filter state stored in URL query parameters:
   * - ?models=Ford:F-150,Chevy:Corvette (selected models)
   * - ?yearMin=2020&yearMax=2024 (year range filter)
   * - ?page=2&size=20 (pagination)
   * - ?sortBy=year&sortOrder=desc (sorting)
   *
   * Example full URL:
   * /search?models=Ford:F-150&yearMin=2020&yearMax=2024&page=1&size=20&sortBy=year&sortOrder=desc
   *
   * The SearchComponent will:
   * 1. Read query params from URL via UrlStateService
   * 2. Fetch data from backend based on those params
   * 3. Display results
   * 4. Update URL when user changes filters/pagination/sorting
   *
   * Component: Will be created as SearchComponent
   */
  {
    path: 'search',
    component: SearchComponent  // Main vehicle search interface

    // Future: Can add child routes if we want sub-pages
    // children: [
    //   { path: 'details/:id', component: VehicleDetailsComponent }
    // ]
  },

  /**
   * WORKSHOP ROUTE
   *
   * Path: 'workshop'
   * URL: http://example.com/workshop
   *
   * Advanced workspace with drag-and-drop customizable layout:
   * - Grid-based layout system (e.g., 12-column grid)
   * - Draggable/resizable panels
   * - Multiple data sources (manufacturer picker, results, charts, etc.)
   * - Panel pop-out to separate windows (multi-monitor support)
   * - Layout persistence to localStorage
   *
   * State management strategy:
   * - URL query params: Same as /search (models, filters, pagination)
   * - localStorage: Panel positions, sizes, visibility (UI preferences)
   * - BroadcastChannel: Sync state across pop-out windows
   *
   * Example URL:
   * /workshop?models=Ford:F-150&layout=custom
   *
   * The WorkshopComponent will:
   * 1. Read filter state from URL (shared with SearchComponent)
   * 2. Read layout config from localStorage
   * 3. Render customizable grid layout
   * 4. Allow panels to be popped out to separate windows
   * 5. Sync data changes across all windows via BroadcastChannel
   *
   * Component: Will be created as WorkshopComponent
   */
  {
    path: 'workshop',
    component: WorkshopComponent  // Drag-and-drop customizable workspace
  },

  /**
   * WILDCARD ROUTE (404 Not Found)
   *
   * Path: '**' (double asterisk)
   *
   * Matches ANY URL that didn't match previous routes.
   * MUST be the last route in the array.
   *
   * Use cases:
   * - User types invalid URL
   * - Broken link from external site
   * - Deleted/renamed route
   *
   * Options for handling:
   * 1. Redirect to home: redirectTo: ''
   * 2. Show 404 page: component: NotFoundComponent
   * 3. Redirect to search: redirectTo: 'search'
   *
   * Current implementation: Redirect to search page
   * This ensures users always see something useful rather than an error.
   *
   * Future: Can create dedicated NotFoundComponent with helpful navigation.
   */
  {
    path: '**',
    redirectTo: 'search',
    pathMatch: 'full'
  }
];

/**
 * APP ROUTING MODULE
 *
 * Angular module that configures the router with our routes.
 *
 * @NgModule decorator marks this as an Angular module
 * - imports: Other modules this module needs
 * - exports: What this module makes available to other modules
 */
@NgModule({
  /**
   * IMPORTS
   *
   * RouterModule.forRoot(routes):
   * - Configures the router at the application ROOT level
   * - Call this ONLY ONCE in the entire app (in AppRoutingModule)
   * - Registers routes globally
   * - Sets up router service and directives
   *
   * forRoot vs forChild:
   * - forRoot(): Use in main AppRoutingModule (application-wide routes)
   * - forChild(): Use in feature modules (lazy-loaded routes)
   *
   * Future router configuration options:
   * RouterModule.forRoot(routes, {
   *   enableTracing: true,        // Debug route navigation in console
   *   useHash: false,              // false = /search, true = /#/search
   *   scrollPositionRestoration: 'enabled',  // Restore scroll on back/forward
   *   anchorScrolling: 'enabled',  // Scroll to #anchors in URLs
   * })
   */
  imports: [RouterModule.forRoot(routes)],

  /**
   * EXPORTS
   *
   * Makes RouterModule available to AppModule and all its components.
   * This gives components access to:
   * - Router service (programmatic navigation)
   * - RouterLink directive (<a routerLink="/search">Search</a>)
   * - RouterOutlet directive (<router-outlet></router-outlet>)
   * - ActivatedRoute service (read current route params)
   *
   * Without this export, components couldn't use routing features.
   */
  exports: [RouterModule]
})
export class AppRoutingModule { }

/**
 * USAGE IN COMPONENTS
 *
 * How components will use this routing configuration:
 *
 * 1. NAVIGATION LINKS (Template):
 *    <a routerLink="/search">Go to Search</a>
 *    <a routerLink="/workshop">Go to Workshop</a>
 *    <a [routerLink]="['/search']" [queryParams]="{models: 'Ford:F-150'}">
 *      Search Ford F-150
 *    </a>
 *
 * 2. PROGRAMMATIC NAVIGATION (Component):
 *    constructor(private router: Router) {}
 *
 *    goToSearch() {
 *      this.router.navigate(['/search'], {
 *        queryParams: { models: 'Ford:F-150', page: 1 }
 *      });
 *    }
 *
 * 3. READ CURRENT ROUTE (Component):
 *    constructor(private route: ActivatedRoute) {}
 *
 *    ngOnInit() {
 *      this.route.queryParams.subscribe(params => {
 *        const models = params['models'];
 *        const page = params['page'];
 *      });
 *    }
 *
 * 4. WITH URL STATE SERVICE (Recommended):
 *    constructor(private urlState: UrlStateService) {}
 *
 *    ngOnInit() {
 *      this.urlState.getQueryParam('models').subscribe(models => {
 *        // Use models value
 *      });
 *    }
 */

/**
 * NEXT STEPS
 *
 * To complete the routing setup:
 *
 * 1. Create placeholder components:
 *    - ng generate component features/home --skip-tests
 *    - ng generate component features/search --skip-tests
 *    - ng generate component features/workshop --skip-tests
 *
 * 2. Uncomment component imports and assignments in routes array above
 *
 * 3. Update AppComponent template to include <router-outlet></router-outlet>
 *    This is where routed components will be displayed
 *
 * 4. Add navigation menu to AppComponent:
 *    - Links to /search and /workshop
 *    - Active route highlighting with routerLinkActive
 *
 * 5. Test navigation:
 *    - Click links between pages
 *    - Use browser back/forward buttons
 *    - Manually type URLs in address bar
 *    - Verify URL query params persist
 */
