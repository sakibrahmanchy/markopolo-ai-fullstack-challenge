import React, { useState } from 'react';
import { useLazyConnectGTMQuery, useLazyConnectFacebookQuery, useLazyConnectShopifyQuery } from '../store/api/oauthApi';
import { useGetDataSourcesQuery, useDeleteDataSourceMutation, useTestConnectionMutation } from '../store/api/dataSourcesApi';
import type { DataSource } from '../types';

const DataSourcesPanel: React.FC = () => {
  const [shopName, setShopName] = useState('');
  const [connectGTM] = useLazyConnectGTMQuery();
  const [connectFacebook] = useLazyConnectFacebookQuery();
  const [connectShopify] = useLazyConnectShopifyQuery();
  const { data: dataSources, isLoading } = useGetDataSourcesQuery(undefined);
  const [deleteDataSource] = useDeleteDataSourceMutation();
  const [testConnection] = useTestConnectionMutation();

  const handleConnectGTM = async () => {
    try {
      const result = await connectGTM(undefined).unwrap();
      if (result.authUrl) {
        window.location.href = result.authUrl;
      }
    } catch (err) {
      console.error('Failed to initiate GTM connection:', err);
    }
  };

  const handleConnectFacebook = async () => {
    try {
      const result = await connectFacebook(undefined).unwrap();
      if (result.authUrl) {
        window.location.href = result.authUrl;
      }
    } catch (err) {
      console.error('Failed to initiate Facebook connection:', err);
    }
  };

  const handleConnectShopify = async () => {
    if (!shopName.trim()) {
      alert('Please enter a shop name');
      return;
    }
    try {
      const result = await connectShopify(shopName.trim()).unwrap();
      if (result.authUrl) {
        window.location.href = result.authUrl;
      }
    } catch (err) {
      console.error('Failed to initiate Shopify connection:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this data source?')) {
      try {
        await deleteDataSource(id).unwrap();
      } catch (err) {
        console.error('Failed to delete data source:', err);
      }
    }
  };

  const handleTestConnection = async (id: string) => {
    try {
      const result = await testConnection(id).unwrap();
      alert(result.success ? 'Connection successful!' : `Connection failed: ${result.message}`);
    } catch (err: any) {
      alert(`Connection test failed: ${err.data?.message || 'Unknown error'}`);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <h1 className="text-2xl font-semibold text-gray-900">Data Sources</h1>
        <p className="text-gray-600 mt-2">
          Connect your marketing data sources to get AI-powered insights and campaign recommendations
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* My Connectors */}
        <div className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">My Connectors</h2>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading data sources...</p>
            </div>
          ) : dataSources && dataSources.length > 0 ? (
            <div className="space-y-3">
              {dataSources.map((dataSource: DataSource) => (
                <div key={dataSource.id} className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-medium text-sm">
                        {dataSource.sourceType.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{dataSource.name}</h3>
                      <p className="text-sm text-gray-500">
                        {dataSource.sourceType} • {dataSource.status}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleTestConnection(dataSource.id)}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Test
                    </button>
                    <button
                      onClick={() => handleDelete(dataSource.id)}
                      className="px-3 py-1 text-sm border border-red-300 rounded-md text-red-700 hover:bg-red-50"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No data sources connected yet</p>
              <p className="text-sm text-gray-400 mt-1">Connect your apps to start using them with PulseHub</p>
            </div>
          )}
        </div>

        {/* Available Connectors */}
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-4">Available Connectors</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Google Tag Manager */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-red-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-medium text-sm">G</span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Google Tag Manager</h3>
                  <p className="text-sm text-gray-500">Track website events and user behavior</p>
                </div>
              </div>
              <button
                onClick={handleConnectGTM}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Connect GTM
              </button>
            </div>

            {/* Facebook Pixel */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
                  <span className="text-white font-medium text-sm">F</span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Facebook Pixel</h3>
                  <p className="text-sm text-gray-500">Track conversions and optimize ads</p>
                </div>
              </div>
              <button
                onClick={handleConnectFacebook}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Connect Facebook
              </button>
            </div>

            {/* Shopify */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-700 rounded-lg flex items-center justify-center">
                  <span className="text-white font-medium text-sm">S</span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Shopify</h3>
                  <p className="text-sm text-gray-500">Access e-commerce data and customer insights</p>
                </div>
              </div>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="your-shop.myshopify.com"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button
                  onClick={handleConnectShopify}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  Connect Shopify
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataSourcesPanel;
