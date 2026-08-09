export class FeatureNotAvailableError extends Error {
  constructor(public readonly featureKey: string) {
    super(`Feature "${featureKey}" is not available for this tenant's plan.`);
    this.name = "FeatureNotAvailableError";
  }
}

export class ResourceLimitExceededError extends Error {
  constructor(
    public readonly resourceKey: string,
    public readonly limit: number,
    public readonly current: number,
  ) {
    super(`Resource "${resourceKey}" limit exceeded: ${current} of ${limit} used.`);
    this.name = "ResourceLimitExceededError";
  }
}
