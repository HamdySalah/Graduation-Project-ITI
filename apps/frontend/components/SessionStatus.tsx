import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';

export default function SessionStatus() {
  const { user } = useAuth();
  const [tokenExpiration, setTokenExpiration] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [lastActivity, setLastActivity] = useState<Date | null>(null);

  useEffect(() => {
    if (!user) return;

    // Get token expiration
    const tokenExp = localStorage.getItem('token_expiration');
    if (tokenExp) {
      setTokenExpiration(new Date(parseInt(tokenExp)));
    }

    // Get last activity
    const lastAct = localStorage.getItem('last_activity');
    if (lastAct) {
      setLastActivity(new Date(parseInt(lastAct)));
    }

    // Update time remaining every minute
    const interval = setInterval(() => {
      if (tokenExpiration) {
        const now = new Date();
        const diff = tokenExpiration.getTime() - now.getTime();
        
        if (diff > 0) {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          setTimeRemaining(`${hours}h ${minutes}m`);
        } else {
          setTimeRemaining('Expired');
        }
      }
    }, 60000); // Update every minute

    // Initial calculation
    if (tokenExpiration) {
      const now = new Date();
      const diff = tokenExpiration.getTime() - now.getTime();
      
      if (diff > 0) {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setTimeRemaining(`${hours}h ${minutes}m`);
      } else {
        setTimeRemaining('Expired');
      }
    }

    return () => clearInterval(interval);
  }, [user, tokenExpiration]);

  if (!user) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <h3 className="text-sm font-medium text-blue-800 mb-2">Session Information</h3>
      <div className="space-y-1 text-xs text-blue-700">
        <div className="flex justify-between">
          <span>User:</span>
          <span className="font-medium">{user.email}</span>
        </div>
        <div className="flex justify-between">
          <span>Role:</span>
          <span className="font-medium capitalize">{user.role}</span>
        </div>
        {tokenExpiration && (
          <div className="flex justify-between">
            <span>Session expires:</span>
            <span className="font-medium">{tokenExpiration.toLocaleString()}</span>
          </div>
        )}
        {timeRemaining && (
          <div className="flex justify-between">
            <span>Time remaining:</span>
            <span className={`font-medium ${timeRemaining === 'Expired' ? 'text-red-600' : ''}`}>
              {timeRemaining}
            </span>
          </div>
        )}
        {lastActivity && (
          <div className="flex justify-between">
            <span>Last activity:</span>
            <span className="font-medium">{lastActivity.toLocaleString()}</span>
          </div>
        )}
      </div>
    </div>
  );
}
