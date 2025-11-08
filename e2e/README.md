# E2E Testing with Playwright

**Created:** 2025-01-11  
**Framework:** Playwright  
**Purpose:** End-to-end testing for simulator application

---

## 🚀 Quick Start

### Installation

```bash
cd e2e
npm install
npx playwright install
```

### Run Tests

```bash
# Run all tests
npm test

# Run tests in headed mode (visible browser)
npm run test:headed

# Run tests in UI mode (interactive)
npm run test:ui

# Debug tests
npm run test:debug
```

---

## 📊 Test Reports

```bash
# View test report
npm run test:report
```

Reports are generated in `test-results/` and `playwright-report/` directories.

---

## 🧪 Test Suites

### 1. Dashboard Tests
- Dashboard loading
- System overview cards
- Connection status
- Metrics chart

### 2. Station Creation Tests
- Create station workflow
- Start station
- Stop station
- Delete station

### 3. Health Check Tests
- Health endpoint
- Metrics endpoint
- Detailed health endpoint

---

## 📁 Test Structure

```
e2e/
├── tests/
│   ├── dashboard.spec.js
│   ├── station-creation.spec.js
│   └── health-check.spec.js
├── playwright.config.js
└── package.json
```

---

## ⚙️ Configuration

Tests are configured to:
- Run against `http://localhost:3001`
- Automatically start server if not running
- Run in parallel for faster execution
- Generate HTML, JSON, and JUnit reports
- Take screenshots on failure
- Record video on failure

---

## 🔧 CI/CD Integration

Tests can be integrated into CI/CD pipeline:

```yaml
- name: Run E2E tests
  run: |
    cd e2e
    npx playwright install --with-deps
    npm test
```

---

## ✅ Status

**Created:** 2025-01-11  
**Status:** ✅ **Ready for use**

---

**Team:** QA Engineering

