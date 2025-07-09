import React, { useState } from 'react';

interface ErrorDetailsProps {
  error: any;
}

const ErrorDetails: React.FC<ErrorDetailsProps> = ({ error }) => {
  const [showDetails, setShowDetails] = useState(false);

  if (!error) return null;

  const errorData = error.response?.data;
  const hasDetails = errorData && Object.keys(errorData).length > 0;

  return (
    <div className="mt-4 text-sm">
      <div className="text-red-500 mb-2">{error.message || 'An error occurred'}</div>
      
      {hasDetails && (
        <div>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs text-blue-600 hover:text-blue-800 underline"
          >
            {showDetails ? 'Hide technical details' : 'Show technical details'}
          </button>
          
          {showDetails && (
            <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto max-h-40">
              {JSON.stringify(errorData, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
};

export default ErrorDetails;
