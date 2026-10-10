import "../assets/styles/home.css";
import MainComponent from "../component/Settings/MainComponent";
import Sidebar from "../component/Sidebar";
import Topbar from "../component/Topbar";

const Settings = () => {
  return (
    <div className="home-container">
      <Sidebar />
      <div className="home-main">
        <Topbar />
        <MainComponent />
      </div>
    </div>
  );
};

export default Settings;
