import "../assets/styles/home.css";
import MainContent from "../component/MainContent";
import Sidebar from "../component/Sidebar";
import Topbar from "../component/Topbar";

const Home = () => {
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

export default Home;
