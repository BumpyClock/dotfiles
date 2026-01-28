# Parallelization Examples (Optional)

Use these only when you need concrete templates for interface-first parallelization.

## Example 1: API Feature

Goal: Add a REST API for user management.

Interface definitions:
```typescript
interface IUserController {
  getUser(id: string): Promise<User>
  createUser(data: CreateUserDto): Promise<User>
  updateUser(id: string, data: UpdateUserDto): Promise<User>
}

interface IUserService {
  findById(id: string): Promise<User | null>
  create(data: CreateUserDto): Promise<User>
  update(id: string, data: UpdateUserDto): Promise<User>
}

interface IUserRepository {
  findOne(id: string): Promise<UserEntity | null>
  save(entity: UserEntity): Promise<UserEntity>
}
```

Parallel assignments:
- Agent 1: Controller implementation with mocked service
- Agent 2: Service implementation with mocked repository
- Agent 3: Repository implementation with database
- Agent 4: Unit tests for all three
- Agent 5: Integration tests

## Example 2: Frontend Feature

Goal: Add a shopping cart.

Interface definitions:
```typescript
interface CartState {
  items: CartItem[]
  total: number
  loading: boolean
}

interface CartProps {
  onCheckout: () => void
  onItemRemove: (id: string) => void
}

interface CartApi {
  getCart(): Promise<Cart>
  addItem(productId: string, quantity: number): Promise<CartItem>
  removeItem(itemId: string): Promise<void>
}
```

Parallel assignments:
- Agent 1: Cart UI components
- Agent 2: State management
- Agent 3: API integration layer
- Agent 4: Component tests
- Agent 5: State management tests

## Problem-Solving Pattern

1. Analysis agent identifies root cause.
2. Parallel fix agents each address one issue.
3. Integration agent merges fixes and reruns tests.
