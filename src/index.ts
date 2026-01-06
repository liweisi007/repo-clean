#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

type Command = "init" | "doctor" | "add";

const args = process.argv.slice(2);

function help(exitCode = 0) {
  const text = `
repo-clean ✨

Make your repo look professional in 30 seconds.

Usage:
  repo-clean init
  repo-clean doctor
  repo-clean add license mit

Options:
  -h, --help     Show help
  --force        Overwrite existing files (only for init/add)

Examples:
  repo-clean init
  repo-clean doctor
  repo-clean add license mit
`;
  console.log(text.trim());
  process.exit(exitCode);
}

function hasFlag(flag: string) {
  return args.includes(flag);
}

function cwdPath(p: string) {
  return path.resolve(process.cwd(), p);
}

function exists(p: string) {
  return fs.existsSync(cwdPath(p));
}

function writeFile(p: string, content: string, force = false) {
  const full = cwdPath(p);
  if (fs.existsSync(full) && !force) {
    console.log(`skip: ${p} already exists (use --force to overwrite)`);
    return;
  }
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, "utf8");
  console.log(`${fs.existsSync(full) && force ? "write" : "create"}: ${p}`);
}

function readJson(p: string): any | null {
  try {
    const s = fs.readFileSync(cwdPath(p), "utf8");
    return JSON.parse(s);
  } catch {
    return null;
  }
}

const TEMPLATES = {
  README: (name: string) => `# ${name}\n\n> Describe your project in one sentence.\n\n## Install\n\n## Usage\n\n## License\n`,
  CONTRIBUTING: `# Contributing\n\nThanks for contributing!\n\n## Development\n\n- Fork this repo\n- Create a branch\n- Submit a PR\n`,
  CODE_OF_CONDUCT: `# Code of Conduct\n\nBe respectful. Assume good intent. No harassment.\n`,
  SECURITY: `# Security Policy\n\nPlease report vulnerabilities privately.\n`,
  MIT_LICENSE: `MIT License\n\nCopyright (c) ${new Date().getFullYear()}\n\nPermission is hereby granted, free of charge, to any person obtaining a copy\nof this software and associated documentation files (the "Software"), to deal\nin the Software without restriction, including without limitation the rights\nto use, copy, modify, merge, publish, distribute, sublicense, and/or sell\ncopies of the Software, and to permit persons to whom the Software is\nfurnished to do so, subject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all\ncopies or substantial portions of the Software.\n\nTHE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\nIMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,\nFITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE\nAUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER\nLIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,\nOUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE\nSOFTWARE.\n`
};

function inferProjectName() {
  const pkg = readJson("package.json");
  if (pkg?.name && typeof pkg.name === "string") return pkg.name;
  return path.basename(process.cwd());
}

function cmdInit(force: boolean) {
  const name = inferProjectName();
  writeFile("README.md", TEMPLATES.README(name), force);
  writeFile("CONTRIBUTING.md", TEMPLATES.CONTRIBUTING, force);
  writeFile("CODE_OF_CONDUCT.md", TEMPLATES.CODE_OF_CONDUCT, force);
  writeFile("SECURITY.md", TEMPLATES.SECURITY, force);
  if (!exists("LICENSE") || force) {
    writeFile("LICENSE", TEMPLATES.MIT_LICENSE, force);
  } else {
    console.log("skip: LICENSE already exists");
  }
  console.log("\nDone. Next: run `repo-clean doctor` to check repo health.");
}

function cmdDoctor() {
  const checks: Array<{ path: string; message: string }> = [
    { path: "README.md", message: "Missing README.md" },
    { path: "LICENSE", message: "Missing LICENSE" },
    { path: "CONTRIBUTING.md", message: "Missing CONTRIBUTING.md" },
    { path: "CODE_OF_CONDUCT.md", message: "Missing CODE_OF_CONDUCT.md" },
    { path: "SECURITY.md", message: "Missing SECURITY.md" },
    { path: ".github/workflows", message: "Missing GitHub Actions workflows (.github/workflows)" }
  ];

  let ok = true;
  for (const c of checks) {
    if (!exists(c.path)) {
      ok = false;
      console.log(`❌ ${c.message}`);
    } else {
      console.log(`✅ ${c.path}`);
    }
  }

  if (!ok) {
    console.log("\nTip: run `repo-clean init` to generate missing essentials.");
    process.exitCode = 1;
  } else {
    console.log("\nLooks good ✅");
  }
}

function cmdAdd(sub: string | undefined, value: string | undefined, force: boolean) {
  if (sub === "license") {
    const which = (value || "").toLowerCase();
    if (which !== "mit") {
      console.log(`Only "mit" is supported in this starter version.\n\nExample: repo-clean add license mit`);
      process.exitCode = 1;
      return;
    }
    writeFile("LICENSE", TEMPLATES.MIT_LICENSE, force);
    return;
  }
  console.log(`Unknown add target.\n\nTry: repo-clean add license mit`);
  process.exitCode = 1;
}

if (hasFlag("-h") || hasFlag("--help") || args.length === 0) {
  help(0);
}

const force = hasFlag("--force");
const cmd = args[0] as Command;

switch (cmd) {
  case "init":
    cmdInit(force);
    break;
  case "doctor":
    cmdDoctor();
    break;
  case "add":
    cmdAdd(args[1], args[2], force);
    break;
  default:
    help(1);
}
