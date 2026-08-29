export const VENDOR_ONBOARDING_KEY = 'xenon_vendor_onboarding'

const SAFE_FIELDS = [
  'name',
  'email',
  'DateOfBirth',
  'gender',
  'mobileNumber',
  'company_name',
  'address',
  'city',
  'iban_number',
]

export function createVendorOnboardingDraft(form) {
  return {
    accountCreated: true,
    ...Object.fromEntries(SAFE_FIELDS.map((key) => [key, String(form[key] || '')])),
  }
}

export function canResumeVendorOnboarding({ draft, token, role, expired = false }) {
  return Boolean(draft?.accountCreated && token && role === 'user' && !expired)
}

