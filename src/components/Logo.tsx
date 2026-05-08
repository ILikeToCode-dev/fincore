import React from 'react';

interface LogoProps {
  className?: string;
}

export function Logo({ className = "" }: LogoProps) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* LIGHT MODE: Shows when the site is in light mode. 
          The file should be your SVG with DARK paths.
      */}
      <img 
        src="/logo-light.svg" 
        alt="Fin_Core Logo" 
        className="dark:hidden w-full h-full object-contain" 
      />
      
      {/* DARK MODE: Shows when 'dark' class is present on the html/body. 
          The file should be your SVG with WHITE/GLOWING paths.
      */}
      <img 
        src="/logo-dark.svg" 
        alt="Fin_Core Logo" 
        className="hidden dark:block w-full h-full object-contain" 
      />
    </div>
  );
}