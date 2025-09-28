import React, { useState } from 'react';
import { useLazyConnectGTMQuery, useLazyConnectFacebookQuery, useLazyConnectShopifyQuery } from '../store/api/oauthApi';

const ConnectDataSource: React.FC = () => {
  const [shopName, setShopName] = useState('');
  const [connectGTM] = useLazyConnectGTMQuery();
  const [connectFacebook] = useLazyConnectFacebookQuery();
  const [connectShopify] = useLazyConnectShopifyQuery();

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

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Connect Data Sources</h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Connect your marketing data sources to start building campaigns
        </p>
      </div>
      <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Google Tag Manager */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-600 font-medium text-sm">G</span>
                </div>
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-gray-900">Google Tag Manager</h4>
                <p className="text-xs text-gray-500">Connect your GTM account</p>
              </div>
            </div>
            <button
              onClick={handleConnectGTM}
              className="mt-3 w-full inline-flex justify-center items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Connect GTM
            </button>
          </div>

          {/* Facebook Pixel */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-600 font-medium text-sm">F</span>
                </div>
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-gray-900">Facebook Pixel</h4>
                <p className="text-xs text-gray-500">Connect your Facebook Pixel</p>
              </div>
            </div>
            <button
              onClick={handleConnectFacebook}
              className="mt-3 w-full inline-flex justify-center items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Connect Facebook
            </button>
          </div>

          {/* Shopify */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-green-600 font-medium text-sm">S</span>
                </div>
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-gray-900">Shopify</h4>
                <p className="text-xs text-gray-500">Connect your Shopify store</p>
              </div>
            </div>
            <div className="mt-3">
              <input
                type="text"
                placeholder="your-shop.myshopify.com"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
              <button
                onClick={handleConnectShopify}
                className="mt-2 w-full inline-flex justify-center items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
              >
                Connect Shopify
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConnectDataSource;
