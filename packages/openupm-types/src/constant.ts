// Constants

export const Region = {
  US: 'us',
  CN: 'cn',
};

export enum ReleaseState {
  Pending = 0,
  Building = 1,
  Succeeded = 2,
  Failed = 3,
}

// legacy name: ReleaseReason
export enum ReleaseErrorCode {
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
  ConnectionTimeout = 900,
  // Connection timeout
  HeapOutOfMemroy = 901,
}

// A list of error codes that should be retried.
// legacy name: RetryableReleaseReason
// TODO: move to openupm-build package
export const RetryableReleaseErrorCodes = [
  ReleaseErrorCode.None,
  ReleaseErrorCode.BadRequest,
  ReleaseErrorCode.Unauthorized,
  ReleaseErrorCode.Forbidden,
  ReleaseErrorCode.InternalError,
  ReleaseErrorCode.BadGateway,
  ReleaseErrorCode.ServiceUnavailable,
  ReleaseErrorCode.GatewayTimeout,
  ReleaseErrorCode.BuildTimeout,
  ReleaseErrorCode.BuildCancellation,
  ReleaseErrorCode.ConnectionTimeout,
];

// TODO: move to openupm-data package
export const PUBLIC_GEN_DIR = 'gen';
export const METADATA_LOCAL_LIST_FILENAME = 'metadatalocallist.json';
export const BLOCKED_SCOPES_FILENAME = 'blockedscopes.json';
export const SDPXLIST_FILENAME = 'spdxlist.json';
