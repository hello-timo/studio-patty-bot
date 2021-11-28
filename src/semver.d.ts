declare module "semver" {
  export type Increment = "major" | "minor" | "patch" | "prerelease";

  export function inc(
    version: string,
    increment: "major" | "minor" | "patch"
  ): string;
  export function inc(
    version: string,
    increment: "prerelease",
    prereleaseId: string
  ): string;
}
