import "../assets/styles/home.css";
import Sidebar from "../component/Sidebar";
import Topbar from "../component/Topbar";
import MainContent from "../component/Workout/MainComponent";

const Workout = () => {
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

export default Workout;
