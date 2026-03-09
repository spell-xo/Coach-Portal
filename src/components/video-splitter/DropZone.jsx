import React, { useState } from 'react';
import './DropZone.css';

const DropZone = ({
  onDrop,
  isProcessing,
  processingProgress,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragOver(false);
    onDrop();
  };

  return (
    <div className="drop-zone-container">
      <div
        className={`drop-zone ${isDragOver ? 'drag-over' : ''} ${isProcessing ? 'processing' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isProcessing ? (
          <div className="processing-content">
            <div className="spinner" />
            <h3>Processing Video...</h3>
            <p>{processingProgress}</p>
          </div>
        ) : (
          <div className="drop-content">
            <svg
              className="drop-icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
              />
            </svg>
            <h3>Drop Segment Here</h3>
            <p>Drag the timeline segment here to extract</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DropZone;
