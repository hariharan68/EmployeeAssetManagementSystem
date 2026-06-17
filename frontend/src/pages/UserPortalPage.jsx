import Navbar from "../components/Navbar";
import { getPendingUsers, approveUser, rejectUser, adminCreateUser } from "../api/authApi";


const UserPortalPage = () => {
  return (
    <div>
      <Navbar />
      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "28px 32px" }}>
        <h2>User Portal</h2>
        <p>Coming soon...</p>
      </div>
    </div>
  );
};

export default UserPortalPage;