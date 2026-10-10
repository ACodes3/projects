import "../assets/styles/home.css";
import MainContent from "../component/Profile/MainContent";
import Sidebar from "../component/Sidebar";
import Topbar from "../component/Topbar";

const Profile = () => {
  return (
    <div className="home-container">
      <Sidebar />
      <div className="home-main">
        <Topbar />
        <MainContent />
      </div>
    </div>
  );
};

export default Profile;
