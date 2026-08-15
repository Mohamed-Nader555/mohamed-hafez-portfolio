type TestCloudflareEnv = Record<string, unknown>;

export const env: TestCloudflareEnv = {};

export function setTestCloudflareEnv(next: TestCloudflareEnv): void {
  for (const key of Object.keys(env)) delete env[key];
  Object.assign(env, next);
}
