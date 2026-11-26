const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");
const schema = require("./compliance-schema.json");
const {
  LIMITS,
  validateComplianceDocument,
} = require("./validate-compliance.cjs");

const validatorPath = path.join(__dirname, "validate-compliance.cjs");
const CLI_TIMEOUT_MS = 5000;

function evidence(file = "src/app/layout.tsx", line = 42) {
  return { file, line, description: "Inspected global footer and route registration." };
}

function passCheck() {
  return {
    verdict: "pass",
    check_id: "DPDP-01",
    framework: "DPDP_2023",
    title: "Public Privacy Notice and Policy route",
    summary: "Public /privacy-policy page renders without authentication and is linked in footer and signup.",
    evidence: [evidence("src/app/privacy-policy/page.tsx", 1)],
  };
}

function failCheck() {
  return {
    verdict: "fail",
    check_id: "PGKYC-02",
    framework: "PAYMENT_KYC",
    priority: "blocker",
    title: "Missing Refund and Cancellation Policy page",
    summary: "Razorpay checkout is integrated, but no /refund-policy route or footer link exists.",
    requirement: "Indian payment gateways require a public Refund & Cancellation Policy specifying eligibility and business-day processing timeline.",
    evidence: [evidence("src/app/layout.tsx", 58), evidence("src/app/api/razorpay/order/route.ts", 12)],
    remediation: {
      summary: "Create a public /refund-policy page with concrete refund timelines and link it in the footer and checkout.",
      steps: [
        "Add src/app/refund-policy/page.tsx stating cancellation window and exact 5-7 business days refund timeline.",
        "Add a /refund-policy link in src/app/layout.tsx footer and exclude /refund-policy from auth middleware.",
      ],
      target_paths: ["src/app/refund-policy/page.tsx", "src/app/layout.tsx"],
    },
  };
}

function manualCheck() {
  return {
    verdict: "needs_manual_check",
    check_id: "HYGIENE-08M",
    framework: "LAUNCH_HYGIENE",
    title: "Custom domain SPF, DKIM, and DMARC DNS records",
    summary: "Resend transactional email is used; DNS records live outside repository source.",
    manual_verification: "Verify SPF, DKIM, and DMARC TXT records are active in Cloudflare/DNS dashboard for the sending domain.",
    evidence: [evidence("src/lib/email.ts", 8)],
  };
}

function notApplicableCheck() {
  return {
    verdict: "not_applicable",
    check_id: "MOBSTORE-00",
    framework: "MOBILE_STORES",
    title: "Mobile App Store and Play Store compliance",
    reason: "Repository is a Next.js web application with no Android, iOS, Expo, React Native, or Flutter target.",
    evidence: [evidence("package.json", 1)],
  };
}

function sortedChecks() {
  return [passCheck(), manualCheck(), notApplicableCheck(), failCheck()]
    .sort((a, b) => (a.check_id < b.check_id ? -1 : a.check_id > b.check_id ? 1 : 0));
}

function errorsFor(value) {
  return validateComplianceDocument(value, schema);
}

function runCli(contents) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "validate-compliance-"));
  const filePath = path.join(directory, "compliance-findings.json");
  try {
    fs.writeFileSync(filePath, contents);
    return spawnSync(process.execPath, [validatorPath, filePath], {
      encoding: "utf8",
      timeout: CLI_TIMEOUT_MS,
    });
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

test("compliance schema defines all four verdict branches", () => {
  assert.equal(schema.type, "array");
  assert.deepEqual(
    schema.items.oneOf.map((branch) => branch.properties.verdict.const),
    ["pass", "fail", "needs_manual_check", "not_applicable"],
  );
});

test("accepts empty array and complete sorted multi-framework compliance document via CLI", () => {
  assert.deepEqual(errorsFor([]), []);
  const checks = sortedChecks();
  assert.deepEqual(errorsFor(checks), []);

  const result = runCli(JSON.stringify(checks, null, 2));
  assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);
  assert.match(result.stdout, /PASS: 4 compliance checks valid/);
});

test("enforces framework-to-check_id prefix alignment", () => {
  const mismatched = passCheck();
  mismatched.framework = "PAYMENT_KYC";
  const errors = errorsFor([mismatched]);
  assert(errors.some((err) => err.includes('requires framework "DPDP_2023"')), errors.join("\n"));
});

test("enforces unique check_ids and lexicographic sorting", () => {
  const first = passCheck();
  const second = failCheck();
  assert(errorsFor([second, first]).some((err) => err.includes("sorted lexicographically")));

  const dup = passCheck();
  assert(errorsFor([first, dup]).some((err) => err.includes("duplicate of")));
});

test("rejects unsafe source and target paths", () => {
  const badEvidence = passCheck();
  badEvidence.evidence[0].file = "../etc/passwd";
  assert(errorsFor([badEvidence]).some((err) => err.includes("safe repository-relative source path")));

  const badTarget = failCheck();
  badTarget.remediation.target_paths = ["C:\\Windows\\system32\\cmd.exe"];
  assert(errorsFor([badTarget]).some((err) => err.includes("safe repository-relative source path")));
});

test("rejects cross-branch forbidden fields and empty remediation", () => {
  const badPass = passCheck();
  badPass.priority = "high";
  assert.notEqual(errorsFor([badPass]).length, 0);

  const badFail = failCheck();
  badFail.remediation.steps = [];
  assert.notEqual(errorsFor([badFail]).length, 0);
});

test("CLI rejects oversized and invalid UTF-8 inputs cleanly", () => {
  const oversized = runCli(Buffer.alloc(LIMITS.inputBytes + 1, 0x20));
  assert.equal(oversized.status, 1);
  assert.match(oversized.stderr, /byte limit/);

  const badUtf8 = runCli(Buffer.from([0x5b, 0x80, 0x5d]));
  assert.equal(badUtf8.status, 1);
  assert.match(badUtf8.stderr, /input is not valid UTF-8/);
});
