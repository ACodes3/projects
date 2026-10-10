import { useState } from "react";
import { FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaTimes, FaTimesCircle } from "react-icons/fa";
import "../../assets/styles/toast.css";

const Toast = ({ type = "success", title, message }) => {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  const icons = {
    success: <FaCheckCircle className="toast-icon success" />,
    info: <FaInfoCircle className="toast-icon info" />,
    warning: <FaExclamationTriangle className="toast-icon warning" />,
    error: <FaTimesCircle className="toast-icon error" />,
  };

  return (
    <div className={`toast toast-${type}`}>
      <div className="toast-left">
        {icons[type]}
        <div className="toast-text">
          <h4>{title}</h4>
          <p>{message}</p>
        </div>
      </div>
      <button className="toast-close" onClick={() => setVisible(false)}>
        <FaTimes />
      </button>
    </div>
  );
};

export default Toast;
