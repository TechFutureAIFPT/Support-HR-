import React from "react";
import { Navigate } from "react-router-dom";

const SecurityCompliancePage: React.FC = () => {
  return <Navigate to="/pricing#security" replace />;
};

export default SecurityCompliancePage;
