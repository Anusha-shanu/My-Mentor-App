import React from "react";

export const Textarea = ({ ...props }) => {
  return (
    <textarea
      className="w-full px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      {...props}
    />
  );
};
