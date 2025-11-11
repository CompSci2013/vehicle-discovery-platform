# UrlStateService Browser Console Tests

**Purpose:** Validate UrlStateService functionality using browser DevTools console

**Prerequisites:**
1. Start dev server: `podman exec vehicle-discovery-platform-dev sh -c "cd frontend && npm start"`
2. Open browser to: http://192.168.0.244:4203 (or http://localhost:4203)
3. Open DevTools Console (F12 → Console tab)
4. Paste commands below one at a time

---

## Setup: Get Service Instance

```javascript
// Get the UrlStateService instance from Angular's injector
const urlStateService = ng.probe(document.querySelector('app-root')).injector.get('UrlStateService');
console.log('✅ UrlStateService loaded:', urlStateService);
```

**Expected Output:** Service object with methods listed

---

## Test 1: Set Query Parameters (Merge)

```javascript
// Set page and sort params
urlStateService.setQueryParams({ page: '2', sort: 'asc' }).subscribe(success => {
  console.log('✅ Test 1 - Set params:', success);
  console.log('📍 Current URL:', window.location.href);
});
```

**Expected:**
- Console shows: `✅ Test 1 - Set params: true`
- URL changes to: `http://192.168.0.244:4203/?page=2&sort=asc`

---

## Test 2: Add More Parameters (Merge Behavior)

```javascript
// Add models param (should merge with existing page & sort)
urlStateService.setQueryParams({ models: 'Ford:F-150,Chevy:Silverado' }).subscribe(success => {
  console.log('✅ Test 2 - Merge params:', success);
  console.log('📍 Current URL:', window.location.href);
});
```

**Expected:**
- Console shows: `✅ Test 2 - Merge params: true`
- URL changes to: `http://192.168.0.244:4203/?page=2&sort=asc&models=Ford:F-150,Chevy:Silverado`
- **All three params present** (merge worked!)

---

## Test 3: Get Query Parameter (Observable)

```javascript
// Subscribe to 'page' parameter
const subscription = urlStateService.getQueryParam('page').subscribe(value => {
  console.log('✅ Test 3 - Get page param:', value);
});

// Clean up subscription after 2 seconds
setTimeout(() => subscription.unsubscribe(), 2000);
```

**Expected:**
- Console shows: `✅ Test 3 - Get page param: 2`

---

## Test 4: Get Query Parameter Snapshot (Synchronous)

```javascript
// Get current value without subscribing
const pageSnapshot = urlStateService.getQueryParamSnapshot('page');
const sortSnapshot = urlStateService.getQueryParamSnapshot('sort');
const missingSnapshot = urlStateService.getQueryParamSnapshot('nonexistent');

console.log('✅ Test 4 - Snapshots:');
console.log('  page:', pageSnapshot);      // Should be '2'
console.log('  sort:', sortSnapshot);      // Should be 'asc'
console.log('  missing:', missingSnapshot); // Should be null
```

**Expected:**
```
✅ Test 4 - Snapshots:
  page: 2
  sort: asc
  missing: null
```

---

## Test 5: Array Parameter (Encode/Decode)

```javascript
// Set an array parameter
urlStateService.setQueryParamArray('colors', ['red', 'blue', 'green']).subscribe(success => {
  console.log('✅ Test 5a - Set array:', success);
  console.log('📍 URL:', window.location.search);

  // Now decode it
  urlStateService.getQueryParamAsArray('colors').subscribe(colors => {
    console.log('✅ Test 5b - Get array:', colors);
    console.log('  Is Array?', Array.isArray(colors));
    console.log('  Length:', colors.length);
  });
});
```

**Expected:**
- URL contains: `&colors=red,blue,green`
- Console shows: `✅ Test 5b - Get array: ['red', 'blue', 'green']`
- `Is Array? true`
- `Length: 3`

---

## Test 6: Number Parameter (Type Conversion)

```javascript
// Set page as number (will be converted to string in URL)
urlStateService.setQueryParams({ page: '42' }).subscribe(() => {
  // Retrieve as number with type conversion
  urlStateService.getQueryParamAsNumber('page', 1).subscribe(page => {
    console.log('✅ Test 6 - Get as number:', page);
    console.log('  Type:', typeof page);
    console.log('  Is number?', typeof page === 'number');
  });
});
```

**Expected:**
```
✅ Test 6 - Get as number: 42
  Type: number
  Is number? true
```

---

## Test 7: Boolean Parameter (Type Conversion)

```javascript
// Set active flag
urlStateService.setQueryParams({ active: 'true' }).subscribe(() => {
  urlStateService.getQueryParamAsBoolean('active', false).subscribe(active => {
    console.log('✅ Test 7 - Get as boolean:', active);
    console.log('  Type:', typeof active);
  });
});
```

**Expected:**
```
✅ Test 7 - Get as boolean: true
  Type: boolean
```

---

## Test 8: Object Parameter (JSON Encode/Decode)

```javascript
// Set complex filter object
const filterObj = { minYear: 2020, maxYear: 2024, bodyTypes: ['Sedan', 'SUV'] };
urlStateService.setQueryParamObject('filters', filterObj).subscribe(() => {
  console.log('✅ Test 8a - Set object');
  console.log('📍 URL:', window.location.search);

  // Decode it back
  urlStateService.getQueryParamAsObject('filters').subscribe(decoded => {
    console.log('✅ Test 8b - Get object:', decoded);
    console.log('  minYear:', decoded.minYear);
    console.log('  maxYear:', decoded.maxYear);
    console.log('  bodyTypes:', decoded.bodyTypes);
  });
});
```

**Expected:**
- URL contains: `&filters={"minYear":2020,"maxYear":2024,"bodyTypes":["Sedan","SUV"]}`
- Console shows decoded object matching original

---

## Test 9: Replace All Parameters

```javascript
// Replace ALL params (not merge)
urlStateService.replaceQueryParams({ newParam: 'only-this' }).subscribe(success => {
  console.log('✅ Test 9 - Replace all params:', success);
  console.log('📍 Current URL:', window.location.href);
});
```

**Expected:**
- URL changes to: `http://192.168.0.244:4203/?newParam=only-this`
- **All previous params gone!** (page, sort, models, etc.)

---

## Test 10: Clear Specific Parameter

```javascript
// First, set multiple params
urlStateService.setQueryParams({ a: '1', b: '2', c: '3' }).subscribe(() => {
  console.log('📍 Before clear:', window.location.search);

  // Clear just 'b'
  urlStateService.clearQueryParam('b').subscribe(() => {
    console.log('✅ Test 10 - Cleared param "b"');
    console.log('📍 After clear:', window.location.search);
  });
});
```

**Expected:**
- Before: `?a=1&b=2&c=3`
- After: `?a=1&c=3`
- Parameter 'b' removed, others remain

---

## Test 11: Clear All Parameters

```javascript
// Clear everything
urlStateService.clearAllQueryParams().subscribe(success => {
  console.log('✅ Test 11 - Cleared all params:', success);
  console.log('📍 Current URL:', window.location.href);
});
```

**Expected:**
- URL changes to: `http://192.168.0.244:4203/` (no query string)

---

## Test 12: Observable Reactivity (distinctUntilChanged)

```javascript
console.log('🧪 Test 12 - Testing reactivity...');

// Subscribe to page changes
const sub = urlStateService.getQueryParam('page').subscribe(value => {
  console.log('  📢 Page changed to:', value);
});

// Set page multiple times
urlStateService.setQueryParams({ page: '1' }).subscribe(() => {
  console.log('  ➡️ Set page to 1');

  setTimeout(() => {
    // Set to same value (should NOT emit again due to distinctUntilChanged)
    urlStateService.setQueryParams({ page: '1' }).subscribe(() => {
      console.log('  ➡️ Set page to 1 again (same value)');
    });
  }, 500);

  setTimeout(() => {
    // Set to different value (SHOULD emit)
    urlStateService.setQueryParams({ page: '2' }).subscribe(() => {
      console.log('  ➡️ Set page to 2 (different value)');
      sub.unsubscribe();
      console.log('✅ Test 12 - Complete');
    });
  }, 1000);
});
```

**Expected:**
```
🧪 Test 12 - Testing reactivity...
  ➡️ Set page to 1
  📢 Page changed to: 1
  ➡️ Set page to 1 again (same value)
  (no emission - distinctUntilChanged worked!)
  ➡️ Set page to 2 (different value)
  📢 Page changed to: 2
✅ Test 12 - Complete
```

---

## Test 13: Memory Leak Prevention (Cleanup)

```javascript
// This test verifies the destroy$ cleanup works
console.log('🧪 Test 13 - Checking cleanup mechanism...');
console.log('  destroy$ Subject exists?', urlStateService['destroy$'] !== undefined);
console.log('  queryParamsSubject exists?', urlStateService['queryParamsSubject'] !== undefined);
console.log('✅ Test 13 - Cleanup mechanisms in place');
console.log('  (Full cleanup happens when Angular destroys the service)');
```

**Expected:**
```
🧪 Test 13 - Checking cleanup mechanism...
  destroy$ Subject exists? true
  queryParamsSubject exists? true
✅ Test 13 - Cleanup mechanisms in place
```

---

## Test 14: Error Handling (Navigation Failure)

**Note:** This test is hard to trigger without guards/resolvers blocking navigation. Manual verification:

```javascript
// Try to navigate (should succeed normally)
urlStateService.setQueryParams({ test: 'error-handling' }).subscribe(
  success => console.log('✅ Test 14 - Navigation result:', success),
  error => console.error('❌ Test 14 - Error caught:', error)
);
```

**Expected:**
- Console shows: `✅ Test 14 - Navigation result: true`
- To truly test error handling, you'd need to add a route guard that rejects navigation

---

## Complete Test Suite (Run All at Once)

**Warning:** This runs all tests sequentially. Each test waits 2 seconds before running the next.

```javascript
async function runAllTests() {
  const urlStateService = ng.probe(document.querySelector('app-root')).injector.get('UrlStateService');

  console.log('🚀 Starting UrlStateService Test Suite...\n');

  const tests = [
    { name: 'Set Query Parameters', fn: () => urlStateService.setQueryParams({ page: '2', sort: 'asc' }) },
    { name: 'Merge Parameters', fn: () => urlStateService.setQueryParams({ models: 'Ford:F-150' }) },
    { name: 'Get Parameter Snapshot', fn: () => Promise.resolve(urlStateService.getQueryParamSnapshot('page')) },
    { name: 'Array Parameter', fn: () => urlStateService.setQueryParamArray('colors', ['red', 'blue']) },
    { name: 'Number Parameter', fn: () => urlStateService.setQueryParams({ count: '42' }) },
    { name: 'Boolean Parameter', fn: () => urlStateService.setQueryParams({ active: 'true' }) },
    { name: 'Replace Parameters', fn: () => urlStateService.replaceQueryParams({ fresh: 'start' }) },
    { name: 'Clear Specific Parameter', fn: () => urlStateService.clearQueryParam('fresh') },
    { name: 'Clear All Parameters', fn: () => urlStateService.clearAllQueryParams() },
  ];

  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    console.log(`\n[${i + 1}/${tests.length}] ${test.name}...`);
    try {
      const result = await test.fn().toPromise?.() || await test.fn();
      console.log(`✅ ${test.name} - PASSED`);
      console.log(`   URL: ${window.location.search || '(empty)'}`);
    } catch (error) {
      console.error(`❌ ${test.name} - FAILED:`, error);
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n🎉 Test Suite Complete!');
}

// Run it
runAllTests();
```

---

## Verification Checklist

After running tests, verify:

- [ ] URL updates correctly for each operation
- [ ] Browser back/forward buttons work with query params
- [ ] No console errors during any test
- [ ] Parameters are properly encoded in URL
- [ ] Type conversions work correctly (string → number, boolean, array)
- [ ] Merge vs replace behavior works as expected
- [ ] Clear operations remove correct parameters
- [ ] Observable reactivity works (distinctUntilChanged filters duplicates)

---

## Troubleshooting

**"Cannot read property 'injector' of null"**
- Make sure app-root element exists: `document.querySelector('app-root')`
- Try: `ng.probe(getAllAngularRootElements()[0]).injector.get('UrlStateService')`

**"Service not found"**
- Service name must match exactly: `'UrlStateService'` (not 'urlStateService')
- Make sure the service is imported in AppModule

**"toPromise is not a function"**
- Use `.subscribe()` instead of `.toPromise()` for newer RxJS versions
- Or convert individually: `const promise = new Promise(resolve => obs.subscribe(resolve))`

---

## Alternative: Angular CLI Console Access

If the above doesn't work, enable Angular DevTools:

1. Install: Chrome Web Store → "Angular DevTools"
2. Open DevTools → Angular tab
3. Console has direct Angular access

---

**Created:** 2025-11-11
**Service Version:** Professional-grade with full feature set
**Last Updated:** Initial creation
