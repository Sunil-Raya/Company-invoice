import React from 'react';
import '../styles/global.css';

export default function VectorLoader() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
      <svg width="600" height="180" viewBox="0 0 600 180" style={{ overflow: 'visible' }}>
        <defs>
          {/* Mask that defines the shape of the text */}
          <mask id="textMask">
            <text 
              x="50%" 
              y="50%" 
              dy=".35em" 
              textAnchor="middle" 
              fontSize="140" 
              fontWeight="900" 
              fill="white"
              style={{ fontFamily: '"Outfit", sans-serif', letterSpacing: '-2px' }}
            >
              MLFS
            </text>
          </mask>
        </defs>

        {/* Background "Empty" Text (Dark Grey) */}
        <text 
          x="50%" 
          y="50%" 
          dy=".35em" 
          textAnchor="middle" 
          fontSize="140" 
          fontWeight="900" 
          fill="#1a1a1a"
          style={{ fontFamily: '"Outfit", sans-serif', letterSpacing: '-2px' }}
        >
          MLFS
        </text>

        {/* Clipped Liquid Area */}
        <g mask="url(#textMask)">
          {/* Animated Liquid Container that rises */}
          <g className="liquid-container">
            {/* The primary Wave path */}
            <path 
              className="liquid-wave"
              d="M 0 90 Q 75 60 150 90 Q 225 120 300 90 Q 375 60 450 90 Q 525 120 600 90 L 600 300 L 0 300 Z"
              fill="#FFFFFF"
            />
            {/* Repeat the path for seamless horizontal flow */}
            <path 
              className="liquid-wave"
              d="M 600 90 Q 675 60 750 90 Q 825 120 900 90 Q 975 60 1050 90 Q 1125 120 1200 90 L 1200 300 L 600 300 Z"
              fill="#FFFFFF"
            />
            
            {/* Secondary faster wave for depth - slightly tinted or lowered opacity */}
            <path 
              className="liquid-wave-fast"
              d="M 0 100 Q 75 130 150 100 Q 225 70 300 100 Q 375 130 450 100 Q 525 70 600 100 L 600 300 L 0 300 Z"
              fill="#FFFFFF"
              style={{ transform: 'translateX(-40px)' }}
            />
            <path 
              className="liquid-wave-fast"
              d="M 600 100 Q 675 130 750 100 Q 825 70 900 100 Q 975 130 1050 100 Q 1125 70 1200 100 L 1200 300 L 600 300 Z"
              fill="#FFFFFF"
              style={{ transform: 'translateX(-40px)' }}
            />
          </g>
        </g>
      </svg>
    </div>
  );
}
