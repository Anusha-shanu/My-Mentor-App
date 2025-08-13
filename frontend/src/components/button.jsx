import React from "react";

export const Button = ({ children, ...props }) => {
  return (
    <button
      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
      {...props}
    >
      {children}
    </button>
  );
};
