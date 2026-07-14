import { execFileSync } from "node:child_process";

const BASE_URL = "http://127.0.0.1:2000/api/v2";

type Package = {
  language: string;
  language_version: string;
  installed: boolean;
};

async function waitForApi() {
  for (let attempt = 1; attempt <= 30; attempt += 1) {
    try {
      const response = await fetch(`${BASE_URL}/packages`, { signal: AbortSignal.timeout(2_000) });
      if (response.ok) return (await response.json()) as Package[];
    } catch {
      // The container needs a few seconds to initialize.
    }
    await new Promise((resolve) => setTimeout(resolve, 2_000));
  }
  throw new Error("Piston did not become ready within 60 seconds");
}

async function installPackage(language: string, version: string) {
  const response = await fetch(`${BASE_URL}/packages`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ language, version }),
    signal: AbortSignal.timeout(10 * 60_000)
  });
  const payload = (await response.json()) as { language?: string; version?: string; message?: string };
  if (!response.ok) throw new Error(payload.message || `Failed to install ${language}`);
  console.log(`Installed ${payload.language} ${payload.version}`);
}

async function main() {
  console.log("Starting isolated Piston runner...");
  execFileSync("docker", ["compose", "-f", "docker-compose.runner.yml", "up", "-d"], { stdio: "inherit" });
  const packages = await waitForApi();

  const targets = [
    { language: "python", version: "3.x" },
    { language: "gcc", version: "10.x" }
  ];

  for (const target of targets) {
    const installed = packages.some((item) => item.language === target.language && item.installed);
    if (installed) {
      console.log(`${target.language} runtime already installed`);
      continue;
    }
    await installPackage(target.language, target.version);
  }

  const runtimes = await fetch(`${BASE_URL}/runtimes`).then((response) => response.json());
  console.log("Runner ready:", runtimes);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
