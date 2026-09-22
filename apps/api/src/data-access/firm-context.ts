/** Derived from the authenticated session on every request. Never trust a client-supplied firmId. */
export interface FirmContext {
  firmId: string;
  memberId: string;
  isAdmin: boolean;
}
