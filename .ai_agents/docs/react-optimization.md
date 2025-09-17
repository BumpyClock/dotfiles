# React Performance Optimization Guide

## Core Performance Principles

### 1. Optimize Rendering with Memoization
```javascript
// ✅ DO: Memoize expensive computations
const expensiveValue = useMemo(() => 
  calculateExpensiveValue(data), [data]
);

// ✅ DO: Memoize callbacks passed to child components
const handleClick = useCallback((id) => {
  setSelectedId(id);
}, []);

// ✅ DO: Use React.memo for components with stable props
const ExpensiveChild = React.memo(({ data, onClick }) => {
  return <div onClick={onClick}>{data.name}</div>;
});
```

### 2. Leverage React 18 Concurrent Features
```javascript
// ✅ DO: Use transitions for non-urgent updates
const [isPending, startTransition] = useTransition();

const handleSearch = (query) => {
  startTransition(() => {
    setSearchResults(performExpensiveSearch(query));
  });
};

// ✅ DO: Defer expensive values
const deferredQuery = useDeferredValue(searchQuery);
const searchResults = useMemo(
  () => performSearch(deferredQuery),
  [deferredQuery]
);
```

### 3. Implement Code Splitting
```javascript
// ✅ DO: Split routes
const Dashboard = lazy(() => import('./Dashboard'));

// ✅ DO: Split heavy components
const ChartComponent = lazy(() => import('./ChartComponent'));

// ✅ DO: Use Suspense boundaries
<Suspense fallback={<Spinner />}>
  <Dashboard />
</Suspense>
```

### 4. Optimize State Management
```javascript
// ✅ DO: Colocate state near usage
function TodoItem({ todo }) {
  // State only this component needs
  const [isEditing, setIsEditing] = useState(false);
}

// ✅ DO: Split global state by domain
const useUserStore = create((set) => ({...}));
const useProductStore = create((set) => ({...}));
```

## Critical Performance Pitfalls to Avoid

### 1. Creating Objects/Arrays in Render
```javascript
// ❌ AVOID: New object every render
<Child style={{ margin: 10 }} />

// ✅ DO: Define outside or memoize
const childStyle = { margin: 10 };
// or
const childStyle = useMemo(() => ({ margin: 10 }), []);
```

### 2. Missing Dependencies in Hooks
```javascript
// ❌ AVOID: Stale closures
useEffect(() => {
  doSomething(value);
}, []); // Missing 'value' dependency

// ✅ DO: Include all dependencies
useEffect(() => {
  doSomething(value);
}, [value]);
```

### 3. Inefficient List Rendering
```javascript
// ❌ AVOID: Using index as key with dynamic lists
items.map((item, index) => <Item key={index} />)

// ✅ DO: Use stable, unique IDs
items.map((item) => <Item key={item.id} />)

// ✅ DO: Virtualize large lists
import { FixedSizeList } from 'react-window';
```

### 4. Uncontrolled useEffect Cleanup
```javascript
// ❌ AVOID: Memory leaks
useEffect(() => {
  const timer = setInterval(updateData, 1000);
  // Missing cleanup!
}, []);

// ✅ DO: Always cleanup
useEffect(() => {
  const timer = setInterval(updateData, 1000);
  return () => clearInterval(timer);
}, []);
```

### 5. Over-fetching and Under-caching
```javascript
// ❌ AVOID: Fetching on every render
function Component() {
  const [data, setData] = useState();
  
  // This runs on every render!
  fetch('/api/data').then(setData);
}

// ✅ DO: Use proper data fetching libraries
const { data } = useQuery({
  queryKey: ['userData'],
  queryFn: fetchUserData,
  staleTime: 5 * 60 * 1000, // 5 minutes
});
```

## Performance Checklist

### Before Optimization
- [ ] Profile with React DevTools Profiler
- [ ] Identify actual performance bottlenecks
- [ ] Measure with real data volumes

### Rendering Optimizations
- [ ] Wrap expensive components with `React.memo`
- [ ] Memoize expensive computations with `useMemo`
- [ ] Memoize callbacks with `useCallback`
- [ ] Use `key` prop correctly in lists
- [ ] Implement virtualization for large lists

### State & Data Management
- [ ] Colocate state close to usage
- [ ] Split global state by domain
- [ ] Use server state management (React Query/SWR)
- [ ] Implement optimistic updates for better UX

### Bundle & Loading
- [ ] Implement route-based code splitting
- [ ] Lazy load heavy components
- [ ] Use dynamic imports for conditional features
- [ ] Optimize images with next/image or lazy loading

### React 18+ Features
- [ ] Use `useTransition` for non-urgent updates
- [ ] Implement `useDeferredValue` for expensive filters
- [ ] Add Suspense boundaries for better loading states

## Quick Reference: When to Use What

| Optimization | Use When |
|-------------|----------|
| `React.memo` | Component receives same props frequently |
| `useMemo` | Expensive calculations depend on specific values |
| `useCallback` | Passing callbacks to memoized child components |
| `useTransition` | Updates can be interrupted (search, filters) |
| `useDeferredValue` | Need to keep UI responsive during typing |
| Code Splitting | Components/routes are large or conditionally used |
| Virtualization | Rendering 100+ items in a list |

## Red Flags in Code Review

1. **Inline object/array creation** in props
2. **Missing dependency arrays** in hooks
3. **No cleanup** in useEffect
4. **Direct state mutation** (e.g., `state.push()`)
5. **Fetching without caching** strategy
6. **Large lists without virtualization**
7. **Everything in one bundle** (no code splitting)
8. **Premature optimization** without profiling