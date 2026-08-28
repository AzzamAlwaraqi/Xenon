import VendorShell from '../../components/vendor/VendorShell.jsx'
import PaymentsPage from '../PaymentsPage.jsx'

export default function VendorPayments() {
  return <VendorShell title="Payments" subtitle="Track booking payments, subscriptions, and financial statements."><PaymentsPage role="vendor" /></VendorShell>
}
