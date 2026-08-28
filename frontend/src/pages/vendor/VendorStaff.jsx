import VendorShell from '../../components/vendor/VendorShell.jsx'
import StaffManagement from '../StaffManagement.jsx'

export default function VendorStaff() {
  return <VendorShell title="Staff" subtitle="Manage the team members who operate your Xenon experiences."><StaffManagement role="vendor" /></VendorShell>
}
