import React from 'react';

/**
 * PrivateRoute - Auth bypassed: always renders children, no login redirect
 */
const PrivateRoute = ({ children }) => {
  return children;
};

export default PrivateRoute;
