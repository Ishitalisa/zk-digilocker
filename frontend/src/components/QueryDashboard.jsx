import React, { useState, useEffect } from 'react';
import { GraphService } from '../utils/graphClient';

const QueryDashboard = () => {
  const [profiles, setProfiles] = useState([]);
  const [recentVerifications, setRecentVerifications] = useState([]);
  const [queryInput, setQueryInput] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load recent verifications (using mock data for demo)
      const verifications = await GraphService.getRecentVerifications(5);
      setRecentVerifications(verifications);
      
      // Generate some mock stats
      const today = new Date();
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      setStats({
        totalVerifications: Math.floor(Math.random() * 1000) + 100,
        totalUsers: Math.floor(Math.random() * 500) + 50,
        adultUsers: Math.floor(Math.random() * 400) + 40,
        indianUsers: Math.floor(Math.random() * 300) + 30,
      });
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!queryInput.trim()) {
      setError('Please enter an ENS name to search');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      // For demo purposes, use mock data
      const result = await GraphService.getProfileByENSMock(queryInput.trim());
      setSearchResult(result);
      
    } catch (error) {
      console.error('Search error:', error);
      setError(`Search failed: ${error.message}`);
      setSearchResult(null);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (isAdult, isIndian, hasExpired) => {
    const badges = [];
    
    if (isAdult) badges.push({ text: 'Adult', color: 'bg-green-100 text-green-800' });
    if (isIndian) badges.push({ text: 'Indian', color: 'bg-blue-100 text-blue-800' });
    if (hasExpired) badges.push({ text: 'Expired', color: 'bg-red-100 text-red-800' });
    
    return badges;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">The Graph Query Dashboard</h2>
      
      {/* Search Section */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4 text-gray-700">Search Profile by ENS Name</h3>
        <div className="flex gap-3">
          <input
            type="text"
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            placeholder="Enter ENS name (e.g., john-doe-adult-indian)"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
        
        {error && (
          <div className="mt-3 p-3 bg-red-100 border border-red-300 rounded-lg text-red-700">
            {error}
          </div>
        )}
      </div>

      {/* Search Results */}
      {searchResult && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">Search Results</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-start mb-3">
              <h4 className="text-xl font-semibold text-gray-800">{searchResult.ensName}</h4>
              <div className="flex gap-2">
                {getStatusBadge(searchResult.isAdult, searchResult.isIndian, searchResult.hasExpired).map((badge, index) => (
                  <span key={index} className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
                    {badge.text}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
              <div>
                <span className="font-medium">Profile ID:</span>
                <div className="font-mono text-xs mt-1">{searchResult.id}</div>
              </div>
              <div>
                <span className="font-medium">Verified At:</span>
                <div className="mt-1">{formatDate(searchResult.verifiedAt)}</div>
              </div>
              <div>
                <span className="font-medium">Last Updated:</span>
                <div className="mt-1">{formatDate(searchResult.lastUpdated)}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Section */}
      {stats && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">Platform Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.totalVerifications}</div>
              <div className="text-sm text-gray-600">Total Verifications</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.totalUsers}</div>
              <div className="text-sm text-gray-600">Total Users</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.adultUsers}</div>
              <div className="text-sm text-gray-600">Adult Users</div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.indianUsers}</div>
              <div className="text-sm text-gray-600">Indian Users</div>
            </div>
          </div>
        </div>
      )}

      {/* Example Queries Section */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4 text-gray-700">Example GraphQL Queries</h3>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-2">Try searching for these example ENS names:</div>
          <div className="flex flex-wrap gap-2">
            {[
              'john-doe-adult-indian',
              'alice-smith-expired',
              'bob-jones-adult',
              'charlie-brown-indian'
            ].map((name) => (
              <button
                key={name}
                onClick={() => {
                  setQueryInput(name);
                  setTimeout(() => handleSearch(), 100);
                }}
                className="px-3 py-1 bg-white border border-gray-300 rounded-md text-sm hover:bg-gray-100 transition-colors"
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* GraphQL Endpoint Info */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-700">The Graph Integration</h3>
        <div className="bg-gray-50 rounded-lg p-4 text-sm">
          <div className="mb-2">
            <span className="font-medium">Subgraph Endpoint:</span>
            <div className="font-mono text-xs mt-1 break-all">
              https://api.thegraph.com/subgraphs/name/ishitalisa/zk-digilocker
            </div>
          </div>
          <div className="mb-2">
            <span className="font-medium">Status:</span>
            <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
              Demo Mode (Using Mock Data)
            </span>
          </div>
          <div className="text-xs text-gray-500 mt-3">
            This dashboard demonstrates The Graph integration. After deploying the contracts and subgraph, 
            real data will be indexed and queried from the blockchain.
          </div>
        </div>
      </div>
    </div>
  );
};

export default QueryDashboard;