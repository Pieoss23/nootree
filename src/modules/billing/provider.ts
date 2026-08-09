/**
 * Provider-agnostic billing contract. The domain never imports the Stripe
 * SDK directly — a `StripeBillingProvider` implementing this interface will
 * be injected from infrastructure once billing is implemented (out of
 * scope for Milestone 1; see docs/architecture/billing-boundary.md).
 */

export type CreateCheckoutSessionInput = {
  tenantId: string;
  planKey: string;
  successUrl: string;
  cancelUrl: string;
};

export type CheckoutSessionResult = {
  url: string;
};

export type CreateCustomerPortalInput = {
  tenantId: string;
  returnUrl: string;
};

export type CustomerPortalResult = {
  url: string;
};

export interface BillingProvider {
  createCheckoutSession(input: CreateCheckoutSessionInput): Promise<CheckoutSessionResult>;
  createCustomerPortalSession(input: CreateCustomerPortalInput): Promise<CustomerPortalResult>;
}
