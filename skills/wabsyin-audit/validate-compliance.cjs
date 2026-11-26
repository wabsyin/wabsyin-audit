#!/usr/bin/env node

/**
 * Validates compliance-findings.json against compliance-schema.json.
 * Usage: node validate-compliance.cjs <path-to-compliance-findings.json>
 *
 * Dependency-free validator for Track 2 (India DPDP Act, Payment Gateway KYC,
 * Mobile Store Policies, and Production Launch Hygiene) reusing the hardened
 * schema engine and cross-platform file safety rules from validate-findings.cjs.
 */

const fs = require("node:fs");
const path = require("node:path");
const { TextDecoder } = require("node:util");
const {
  LIMITS,
  PATH_FORBIDDEN_CHARACTER,
  UNSAFE_DIAGNOSTIC_CHARACTER,
  VISIBLE_CONTENT,
  WINDOWS_RESERVED_COMPONENT,
  collect,
  collectSchemaErrors,
  hasVisibleProse,
  isSafeRelativeSourcePath,
} = require("./validate-findings.cjs");

const hasOwn = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
const UTF8_DECODER = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true });

const FRAMEWORK_BY_PREFIX = Object.freeze({
  DPDP: "DPDP_2023",
  PGKYC: "PAYMENT_KYC",
  MOBSTORE: "MOBILE_STORES",
  HYGIENE: "LAUNCH_HYGIENE",
});

class JsonStructureError extends Error {}
class SafeInputError extends Error {}

function escapeUnsafeDiagnosticCharacters(value) {
  return String(value).replace(UNSAFE_DIAGNOSTIC_CHARACTER, (character) => {
    const codePoint = character.codePointAt(0);
    return codePoint <= 0xffff
      ? `\\u${codePoint.toString(16).padStart(4, "0")}`
      : `\\u{${codePoint.toString(16)}}`;
  });
}

function safeQuote(value) {
  const serialized = typeof value === "string"
    ? JSON.stringify(value.length > 256 ? `${value.slice(0, 256)}...` : value)
    : String(value);
  return escapeUnsafeDiagnosticCharacters(serialized);
}

function createErrorList() {
  const errors = [];
  Object.defineProperty(errors, "push", {
    value(...messages) {
      const remaining = LIMITS.validationErrors - this.length;
      if (remaining > 0) {
        Array.prototype.push.apply(this, messages.slice(0, remaining).map(escapeUnsafeDiagnosticCharacters));
      }
      return this.length;
    },
  });
  return errors;
}

function isWindowsDeviceOrPipePath(filePath) {
  if (typeof filePath !== "string" || filePath.length === 0) return true;
  if (/^(?:\\\\\.\\|\\\\\?\\|\/\/\.\/|\/\/\?\/)/.test(filePath)) return true;
  const baseName = path.win32.basename(filePath);
  return WINDOWS_RESERVED_COMPONENT.test(baseName);
}

function readFileWithinLimit(file) {
  const noFollow = fs.constants.O_NOFOLLOW;
  const nonBlock = fs.constants.O_NONBLOCK;
  const hasPosixSafeOpen = Number.isInteger(noFollow) && noFollow !== 0 && Number.isInteger(nonBlock) && nonBlock !== 0;
  if (!hasPosixSafeOpen && process.platform !== "win32") {
    throw new SafeInputError("OS no-follow and nonblocking input protection is unavailable");
  }

  let lstatBefore = null;
  if (!hasPosixSafeOpen) {
    if (isWindowsDeviceOrPipePath(file)) throw new SafeInputError("input must be a regular file");
    lstatBefore = fs.lstatSync(file, { bigint: true });
    if (lstatBefore.isSymbolicLink()) throw new SafeInputError("input must not be a symlink");
    if (!lstatBefore.isFile()) throw new SafeInputError("input must be a regular file");
    if (lstatBefore.size > BigInt(LIMITS.inputBytes)) throw new SafeInputError(`input exceeds ${LIMITS.inputBytes} byte limit`);
  }

  let descriptor;
  try {
    descriptor = fs.openSync(
      file,
      hasPosixSafeOpen ? (fs.constants.O_RDONLY | noFollow | nonBlock) : fs.constants.O_RDONLY,
    );
  } catch (error) {
    if (error && (error.code === "ELOOP" || error.code === "EMLINK")) {
      throw new SafeInputError("input must not be a symlink");
    }
    throw error;
  }

  try {
    const stat = fs.fstatSync(descriptor, { bigint: true });
    if (!stat.isFile()) throw new SafeInputError("input must be a regular file");
    if (lstatBefore !== null && (stat.dev !== lstatBefore.dev || (lstatBefore.ino !== 0n && stat.ino !== lstatBefore.ino))) {
      throw new SafeInputError("input identity changed during open");
    }
    if (stat.size > BigInt(LIMITS.inputBytes)) throw new SafeInputError(`input exceeds ${LIMITS.inputBytes} byte limit`);

    const chunks = [];
    const buffer = Buffer.allocUnsafe(64 * 1024);
    let bytesRead = 0;
    while (true) {
      const count = fs.readSync(descriptor, buffer, 0, buffer.length, null);
      if (count === 0) break;
      bytesRead += count;
      if (bytesRead > LIMITS.inputBytes) throw new SafeInputError(`input exceeds ${LIMITS.inputBytes} byte limit`);
      chunks.push(Buffer.from(buffer.subarray(0, count)));
    }
    if (lstatBefore !== null) {
      const statAfter = fs.fstatSync(descriptor, { bigint: true });
      if (!statAfter.isFile() || statAfter.dev !== stat.dev || statAfter.ino !== stat.ino || statAfter.size !== BigInt(bytesRead)) {
        throw new SafeInputError("input changed while reading");
      }
    }
    try {
      return UTF8_DECODER.decode(Buffer.concat(chunks, bytesRead));
    } catch {
      throw new SafeInputError("input is not valid UTF-8");
    }
  } finally {
    fs.closeSync(descriptor);
  }
}

function enforceJsonTextLimits(contents) {
  const containers = [];
  let inString = false;
  let escaped = false;

  function markArrayItem() {
    const container = containers[containers.length - 1];
    if (!container || container.type !== "array" || !container.expectsItem) return;
    container.expectsItem = false;
    container.items++;
    if (container.items > LIMITS.arrayItems) {
      throw new JsonStructureError(`input exceeds ${LIMITS.arrayItems} item array limit`);
    }
  }

  for (let index = 0; index < contents.length; index++) {
    const character = contents[index];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (character === "\\") {
        escaped = true;
      } else if (character === "\"") {
        inString = false;
      }
      continue;
    }

    if (character === "\"") {
      markArrayItem();
      inString = true;
    } else if (character === "[" || character === "{") {
      markArrayItem();
      if (containers.length >= LIMITS.nestingDepth) {
        throw new JsonStructureError(`input exceeds ${LIMITS.nestingDepth} level nesting depth limit`);
      }
      containers.push({
        type: character === "[" ? "array" : "object",
        expectsItem: character === "[",
        items: 0,
      });
    } else if (character === "]" || character === "}") {
      containers.pop();
    } else if (character === ",") {
      const container = containers[containers.length - 1];
      if (container && container.type === "array") container.expectsItem = true;
    } else if (!/\s/.test(character)) {
      markArrayItem();
    }
  }
}

function collectComplianceSemanticErrors(records) {
  const errors = createErrorList();
  if (!Array.isArray(records)) return errors;

  const checkIds = new Map();
  let previousCheckId = null;

  records.forEach((record, index) => {
    if (errors.length >= LIMITS.validationErrors) return;
    if (!record || typeof record !== "object" || Array.isArray(record)) return;
    const base = `$[${index}]`;

    if (hasOwn(record, "check_id") && typeof record.check_id === "string") {
      if (checkIds.has(record.check_id)) {
        errors.push(`${base}.check_id: duplicate of $[${checkIds.get(record.check_id)}].check_id`);
      } else {
        checkIds.set(record.check_id, index);
      }
      if (previousCheckId !== null && previousCheckId > record.check_id) {
        errors.push(`${base}.check_id: compliance checks must be sorted lexicographically`);
      }
      previousCheckId = record.check_id;

      const dashIndex = record.check_id.indexOf("-");
      const prefix = dashIndex > 0 ? record.check_id.slice(0, dashIndex) : "";
      const expectedFramework = FRAMEWORK_BY_PREFIX[prefix];
      if (expectedFramework && hasOwn(record, "framework") && record.framework !== expectedFramework) {
        errors.push(`${base}.framework: check_id prefix ${safeQuote(prefix)} requires framework ${safeQuote(expectedFramework)}, got ${safeQuote(record.framework)}`);
      }
    }

    if (hasOwn(record, "evidence") && Array.isArray(record.evidence)) {
      record.evidence.forEach((entry, entryIndex) => {
        if (!entry || typeof entry !== "object" || Array.isArray(entry)) return;
        if (hasOwn(entry, "line") && (!Number.isInteger(entry.line) || entry.line < 1)) {
          errors.push(`${base}.evidence[${entryIndex}].line: must be a positive integer`);
        }
        if (hasOwn(entry, "file") && !isSafeRelativeSourcePath(entry.file)) {
          errors.push(`${base}.evidence[${entryIndex}].file: must be a safe repository-relative source path`);
        }
      });
    }

    if (record.remediation && Array.isArray(record.remediation.target_paths)) {
      record.remediation.target_paths.forEach((targetPath, pathIndex) => {
        if (!isSafeRelativeSourcePath(targetPath)) {
          errors.push(`${base}.remediation.target_paths[${pathIndex}]: must be a safe repository-relative source path`);
        }
      });
    }

    const verdict = record.verdict;
    if (verdict === "pass") {
      for (const forbidden of ["priority", "requirement", "remediation", "manual_verification", "reason"]) {
        if (hasOwn(record, forbidden)) errors.push(`${base}: pass check must not contain ${safeQuote(forbidden)}`);
      }
    } else if (verdict === "fail") {
      for (const forbidden of ["manual_verification", "reason"]) {
        if (hasOwn(record, forbidden)) errors.push(`${base}: fail check must not contain ${safeQuote(forbidden)}`);
      }
      if (!record.remediation || !Array.isArray(record.remediation.steps) || record.remediation.steps.length === 0) {
        errors.push(`${base}.remediation.steps: fail check requires at least one actionable remediation step`);
      }
    } else if (verdict === "needs_manual_check") {
      for (const forbidden of ["priority", "requirement", "remediation", "reason"]) {
        if (hasOwn(record, forbidden)) errors.push(`${base}: needs_manual_check must not contain ${safeQuote(forbidden)}`);
      }
    } else if (verdict === "not_applicable") {
      for (const forbidden of ["priority", "summary", "requirement", "remediation", "manual_verification"]) {
        if (hasOwn(record, forbidden)) errors.push(`${base}: not_applicable check must not contain ${safeQuote(forbidden)}`);
      }
    }
  });

  return errors;
}

function validateComplianceDocument(records, schema) {
  const schemaErrors = collectSchemaErrors(schema);
  if (schemaErrors.length > 0) return schemaErrors;
  const errors = collect(records, schema, "$");
  if (errors.length < LIMITS.validationErrors) {
    errors.push(...collectComplianceSemanticErrors(records));
  }
  return errors;
}

function loadSchema(schemaPath) {
  const schema = JSON.parse(fs.readFileSync(schemaPath, "utf8"));
  const errors = collectSchemaErrors(schema);
  if (errors.length > 0) throw new Error(`unsupported or invalid compliance schema:\n${errors.join("\n")}`);
  return schema;
}

function run(file) {
  if (!file) {
    console.error("Usage: node validate-compliance.cjs <path-to-compliance-findings.json>");
    return 1;
  }

  let schema;
  try {
    schema = loadSchema(path.join(__dirname, "compliance-schema.json"));
  } catch (error) {
    console.error("Failed to load compliance-schema.json:", error.message);
    return 1;
  }

  let contents;
  try {
    contents = readFileWithinLimit(file);
  } catch (error) {
    const reason = error instanceof SafeInputError ? error.message : "input could not be opened or read safely";
    console.error(`Failed to read compliance JSON: ${reason}`);
    return 1;
  }

  try {
    enforceJsonTextLimits(contents);
  } catch (error) {
    const reason = error instanceof JsonStructureError ? error.message : "invalid JSON structure";
    console.error(`Failed to parse compliance JSON: ${reason}`);
    return 1;
  }

  let records;
  try {
    records = JSON.parse(contents);
  } catch {
    console.error("Failed to parse compliance JSON: invalid JSON syntax");
    return 1;
  }

  let errors;
  try {
    errors = validateComplianceDocument(records, schema);
  } catch {
    console.error("Failed to validate compliance JSON: unexpected validation error");
    return 1;
  }

  for (const message of errors) console.error("ERROR:", escapeUnsafeDiagnosticCharacters(message));
  if (errors.length > 0) {
    const cap = errors.length === LIMITS.validationErrors ? `; output capped at ${LIMITS.validationErrors}` : "";
    console.error(`FAIL: ${errors.length} validation error(s)${cap}`);
    return 1;
  }
  console.log(`PASS: ${records.length} compliance checks valid`);
  return 0;
}

module.exports = {
  FRAMEWORK_BY_PREFIX,
  LIMITS,
  PATH_FORBIDDEN_CHARACTER,
  UNSAFE_DIAGNOSTIC_CHARACTER,
  VISIBLE_CONTENT,
  WINDOWS_RESERVED_COMPONENT,
  collectComplianceSemanticErrors,
  hasVisibleProse,
  isSafeRelativeSourcePath,
  validateComplianceDocument,
};

if (require.main === module) process.exit(run(process.argv[2]));
