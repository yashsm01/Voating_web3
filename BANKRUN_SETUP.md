# Anchor-Bankrun Setup Guide

## Overview
This guide explains how to set up and use `anchor-bankrun` for faster Solana program testing. Bankrun provides a lightweight alternative to `solana-test-validator` by running tests against an in-process Solana runtime.

## Requirements

### System Requirements
- Node.js 18+ (recommended: 20.18.0 LTS)
- Yarn or npm package manager
- Anchor CLI installed
- Rust and Cargo (for program compilation)

### Dependencies Required
```json
{
  "devDependencies": {
    "anchor-bankrun": "^0.5.0",
    "solana-bankrun": "^0.4.0",
    "@solana/web3.js": "^1.98.2",
    "chai": "^4.3.4",
    "mocha": "^9.0.3",
    "ts-mocha": "^10.0.0",
    "typescript": "^5.7.3"
  }
}
```

## Installation Steps

### 1. Install Required Packages
```bash
yarn add --dev anchor-bankrun solana-bankrun @solana/web3.js
```

### 2. Update TypeScript Configuration
Update your `tsconfig.json`:
```json
{
  "compilerOptions": {
    "types": ["mocha", "chai"],
    "typeRoots": ["./node_modules/@types"],
    "lib": ["es2020"],
    "module": "commonjs",
    "target": "es2020",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "skipLibCheck": true
  }
}
```

### 3. Add Test Scripts
Update your `package.json` scripts:
```json
{
  "scripts": {
    "test:bankrun": "ts-mocha -p ./tsconfig.json -t 1000000 'tests/*-bankrun.ts'",
    "test:regular": "ts-mocha -p ./tsconfig.json -t 1000000 'tests/voating.ts'"
  }
}
```

## Benefits of Anchor-Bankrun

### Speed Improvements
- **Much Faster**: Runs ~10x faster than `solana-test-validator`
- **No Validator Startup**: No need to wait for validator initialization
- **Parallel Testing**: Can run multiple tests simultaneously

### Developer Experience
- **Same API**: Drop-in replacement for `AnchorProvider`
- **Better Debugging**: Cleaner error messages and stack traces
- **Less Dependencies**: Lighter weight than full validator testing

### Memory Efficiency
- **Lower Resource Usage**: Uses significantly less RAM and CPU
- **No Network Calls**: Everything runs in-process
- **Faster CI/CD**: Ideal for automated testing pipelines

## Basic Test Structure

```typescript
import { BankrunProvider, startAnchor } from "anchor-bankrun";
import { PublicKey } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";

describe("your program tests", () => {
  let context: any;
  let provider: BankrunProvider;
  let program: Program<YourProgram>;

  before(async () => {
    // Start bankrun context
    context = await startAnchor("", [
      { name: "your_program", programId: new PublicKey("Your_Program_ID") }
    ], []);

    // Create bankrun provider
    provider = new BankrunProvider(context);

    // Initialize program
    program = new Program<YourProgram>(IDL, provider);
  });

  it("should test your instruction", async () => {
    // Your test logic here
  });
});
```

## Key Differences from Regular Anchor Testing

### Provider Setup
- **Regular Anchor**: Uses `anchor.AnchorProvider.env()`
- **Bankrun**: Uses `new BankrunProvider(context)`

### Account Funding
- **Regular Anchor**: Requires manual airdrop setup
- **Bankrun**: Provider wallet is pre-funded automatically

### Program Loading
- **Regular Anchor**: Reads from `anchor.workspace`
- **Bankrun**: Loads from IDL and deployed program

## Common Issues and Solutions

### TypeScript Errors
If you encounter TypeScript errors about account types:
1. Ensure you're using the correct IDL imports
2. Build your program first with `anchor build`
3. Check that account names match your Rust program exactly

### Missing Signatures
If you get "Missing signature" errors:
1. Ensure you're using `provider.wallet.publicKey` as the signer
2. For PDAs, make sure you're generating them correctly
3. Don't forget to include all required accounts in the `.accounts()` call

### Performance Issues
For optimal performance:
1. Use `before()` hook to set up the context once per test suite
2. Avoid recreating the provider for each test
3. Consider using parallel test execution for independent tests

## Running Tests

### Bankrun Tests Only
```bash
yarn test:bankrun
```

### All Tests
```bash
anchor test
```

### With Verbose Output
```bash
yarn test:bankrun --reporter spec
```

## Best Practices

1. **Separate Test Files**: Keep bankrun tests in separate files (e.g., `*-bankrun.ts`)
2. **Parallel Execution**: Design tests to run independently for faster execution
3. **Error Testing**: Always test both success and failure scenarios
4. **Resource Cleanup**: Tests clean up automatically, but be mindful of state
5. **Realistic Data**: Use realistic test data that matches production scenarios

## Troubleshooting

### Common Commands
```bash
# Clean and rebuild
anchor clean && anchor build

# Verify program deployment
solana program show <PROGRAM_ID>

# Check TypeScript compilation
npx tsc --noEmit

# Run specific test
yarn test:bankrun --grep "test name"
```

### Debug Mode
To enable debug logging:
```bash
RUST_LOG=debug yarn test:bankrun
```

This setup provides a much faster and more efficient testing environment for Solana programs while maintaining compatibility with the Anchor framework.
