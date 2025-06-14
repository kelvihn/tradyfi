import React from 'react';
import { Link } from 'wouter';

const Logo = ({ width = '150px', to = '/' }) => {
  return (
    <Link to={to}>
      <img
        src="/logo.svg"
        alt="Logo"
        style={{ width, height: 'auto' }}
      />
    </Link>
  );
};

export default Logo;
