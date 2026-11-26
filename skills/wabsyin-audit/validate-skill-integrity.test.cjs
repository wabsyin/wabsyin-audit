const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const complianceSchema = require("./compliance-schema.json");
const { FRAMEWORK_BY_PREFIX } = require("./validate-compliance.cjs");

const skillDir = __dirname;
const repoRoot = path.resolve(skillDir, "..", "..");

const TRACK1_COMPANIONS = [
  "AI-AND-LLM.md",
  "CLIENT-SIDE.md",
  "CLOUD-AND-DEPLOYMENT.md",
  "DATA-ISOLATION-AND-LIFECYCLE.md",
  "DESKTOP-MOBILE-AND-LOCAL-IPC.md",
  "MEMORY-SAFETY-AND-BINARY.md",
  "PAYMENT-AND-BILLING-SECURITY.md",
  "PROTOCOLS-RPC-AND-MESSAGING.md",
  "RESOURCE-EXHAUSTION-AND-AVAILABILITY.md",
  "SUPPLY-CHAIN-AND-RELEASE.md",
  "VIBE-CODING-AND-BAAS.md",
  "WEB-PROTOCOL-AND-AUTH.md",
];

const TRACK2_COMPANIONS = [
  { file: "INDIA-DPDP-AND-PRIVACY-COMPLIANCE.md", prefix: "DPDP" },
  { file: "PAYMENT-GATEWAY-PAGES-AND-KYC.md", prefix: "PGKYC" },
  { file: "MOBILE-APP-AND-STORE-COMPLIANCE.md", prefix: "MOBSTORE" },
  { file: "PRODUCTION-LAUNCH-HYGIENE.md", prefix: "HYGIENE" },
];

test("SKILL.md has valid frontmatter name and non-empty description", () => {
  const skillMd = fs.readFileSync(path.join(skillDir, "SKILL.md"), "utf8");
  const match = skillMd.match(/^---\r?\nname:\s*([a-z0-9-]+)\r?\ndescription:\s*(.+)\r?\n---/);
  assert(match, "SKILL.md frontmatter must define name and description");
  assert.equal(match[1], path.basename(skillDir));
  assert(match[2].trim().length > 40);
});

test("all relative Markdown file links in skill files and README resolve cleanly", () => {
  const mdFiles = [
    path.join(repoRoot, "README.md"),
    ...fs.readdirSync(skillDir)
      .filter((name) => name.endsWith(".md"))
      .map((name) => path.join(skillDir, name)),
  ];

  const linkPattern = /\[[^\]]+\]\(([^)#\s]+)(?:#[^)]+)?\)/g;
  for (const mdFile of mdFiles) {
    const content = fs.readFileSync(mdFile, "utf8");
    let match;
    while ((match = linkPattern.exec(content)) !== null) {
      const target = match[1];
      if (/^(?:https?:|mailto:|file:)/i.test(target)) continue;
      const resolved = path.resolve(path.dirname(mdFile), target);
      assert(
        fs.existsSync(resolved),
        `${path.relative(repoRoot, mdFile)} links to missing file ${target}`,
      );
    }
  }
});

test("all 12 Track 1 security companions satisfy hunter prompt block structure", () => {
  const attackClassesMd = fs.readFileSync(path.join(skillDir, "ATTACK-CLASSES.md"), "utf8");

  for (const companion of TRACK1_COMPANIONS) {
    const filePath = path.join(skillDir, companion);
    assert(fs.existsSync(filePath), `missing Track 1 companion ${companion}`);
    assert(
      attackClassesMd.includes(`(${companion})`),
      `ATTACK-CLASSES.md must reference ${companion}`,
    );

    const content = fs.readFileSync(filePath, "utf8");
    assert.match(content, /^#### When to use this file/m, `${companion}: missing 'When to use this file'`);
    assert.match(content, /^## Core discipline\b/m, `${companion}: missing 'Core discipline'`);
    assert.match(content, /subagent_type:\s*`general`/, `${companion}: missing general subagent_type`);
    assert.match(content, /^\*\*[A-Za-z0-9`][^*]+\*\*/m, `${companion}: missing bold attack-class blocks`);
    assert.match(content, /^## Universal moves\b/m, `${companion}: missing 'Universal moves'`);
    assert.match(content, /^## Validation rules\b/m, `${companion}: missing 'Validation rules'`);
  }
});

test("all Track 2 compliance companions define schema-valid check IDs", () => {
  const idPattern = new RegExp(complianceSchema.items.oneOf[0].properties.check_id.pattern);
  const checkHeadingPattern = /^### `([A-Z]+-[0-9]{2}[A-Z]?)`/gm;

  for (const { file, prefix } of TRACK2_COMPANIONS) {
    assert(FRAMEWORK_BY_PREFIX[prefix], `missing framework mapping for ${prefix}`);
    const content = fs.readFileSync(path.join(skillDir, file), "utf8");
    const ids = [];
    let match;
    while ((match = checkHeadingPattern.exec(content)) !== null) {
      ids.push(match[1]);
    }
    assert(ids.length >= 6, `${file}: expected at least 6 mandatory checks, found ${ids.length}`);
    for (const id of ids) {
      assert(id.startsWith(`${prefix}-`), `${file}: check ${id} does not use prefix ${prefix}-`);
      assert(idPattern.test(id), `${file}: check ${id} fails compliance-schema.json check_id pattern`);
    }
  }
});
