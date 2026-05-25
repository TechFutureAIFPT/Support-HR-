import React from "react";
import { Navigate } from "react-router-dom";

const FAQPage: React.FC = () => {
  return <Navigate to="/pricing#faq" replace />;
};

export default FAQPage;
