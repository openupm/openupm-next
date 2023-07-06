// Constants

export enum ReleaseState {
  Pending = 0,
  Building = 1,
  Succeeded = 2,
  Failed = 3,
}

// TODO: rename to ReleaseFailureReason
export enum ReleaseReason {
  None = 0,
  // Bad request
  BadRequest = 400,
  // Unauthorized
  Unauthorized = 401,
  // Permission error
  Forbidden = 403,
  // Entity too large
  EntityTooLarge = 413,
  // Publish Version conflict
  VersionConflict = 409,
  // Server internal error
  InternalError = 500,
  // Server bad gateway
  BadGateway = 502,
  // Server bad gateway
  ServiceUnavailable = 503,
  // Server bad gateway
  GatewayTimeout = 504,
  // Build timeout.
  BuildTimeout = 700,
  // BuildCancellation
  BuildCancellation = 701,
  // Missing package.json
  PackageNotFound = 800,
  // Private repo
  Private = 801,
  // Package name invalid
  PackageNameInvalid = 803,
  // Invalid format of package.json
  PackageJsonParsingError = 804,
  // Invalid remote branch
  RemoteBranchNotFound = 805,
  // Invalid version
  InvalidVersion = 806,
  // Could not read from remote repository
  RemoteRepositoryUnavailable = 807,
  // Fatal clone
  RemoteSubmoduleUnavailable = 808,
  // Connection timeout
  ConnectionTime = 900,
  // Connection timeout
  HeapOutOfMemroy = 901
}

/**
 * These are the release reasons that are considered failures of the build service.
 * Whenever possible, the build should be retried.
 */
// TODO: rename to RetryableReleaseFailureReason
export const RetryableReleaseReason = [
  ReleaseReason.None,
  ReleaseReason.BadRequest,
  ReleaseReason.Unauthorized,
  ReleaseReason.Forbidden,
  ReleaseReason.InternalError,
  ReleaseReason.BadGateway,
  ReleaseReason.ServiceUnavailable,
  ReleaseReason.GatewayTimeout,
  ReleaseReason.BuildTimeout,
  ReleaseReason.BuildCancellation
];

export const Region = {
  US: "us",
  CN: "cn",
};