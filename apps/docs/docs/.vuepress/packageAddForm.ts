const getParentDirectory = function (filePath: string): string {
  const separatorIndex = filePath.lastIndexOf("/");
  return separatorIndex === -1 ? "" : filePath.slice(0, separatorIndex);
};

const joinPath = function (directory: string, filename: string): string {
  return directory ? `${directory}/${filename}` : filename;
};

export const getPackageAddFormDefaultReadme = function (
  readmePaths: string[],
  packageJsonPath: string | null | undefined,
): string | null {
  if (packageJsonPath) {
    const adjacentReadme = joinPath(getParentDirectory(packageJsonPath), "README.md");
    if (readmePaths.includes(adjacentReadme)) return adjacentReadme;
  }

  if (readmePaths.length === 0) return null;
  if (readmePaths.length === 1) return readmePaths[0];
  if (readmePaths.includes("README.md")) return "README.md";

  const filteredPath = readmePaths.filter((x) => x.endsWith("README.md"));
  if (filteredPath.length > 0) return filteredPath[0];

  return null;
};
