import React from 'react';
import { useGetDataSourcesQuery, useDeleteDataSourceMutation, useTestConnectionMutation } from '../store/api/dataSourcesApi';
import type { DataSource } from '../types';

const DataSourcesList: React.FC = () => {
  const { data: dataSources, isLoading, error } = useGetDataSourcesQuery(undefined);
  const [deleteDataSource] = useDeleteDataSourceMutation();
  const [testConnection] = useTestConnectionMutation();

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

  if (isLoading) return <div>Loading data sources...</div>;
  if (error) return <div>Error loading data sources</div>;

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Data Sources</h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Manage your connected data sources
        </p>
      </div>
      <ul className="divide-y divide-gray-200">
        {dataSources?.map((dataSource: DataSource) => (
          <li key={dataSource.id}>
            <div className="px-4 py-4 flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                    <span className="text-indigo-600 font-medium">
                      {dataSource.sourceType.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="ml-4">
                  <div className="text-sm font-medium text-gray-900">{dataSource.name}</div>
                  <div className="text-sm text-gray-500">
                    Type: {dataSource.sourceType} | Status: {dataSource.status}
                  </div>
                  {dataSource.lastSyncAt && (
                    <div className="text-xs text-gray-400">
                      Last sync: {new Date(dataSource.lastSyncAt).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleTestConnection(dataSource.id)}
                  className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                >
                  Test
                </button>
                <button
                  onClick={() => handleDelete(dataSource.id)}
                  className="inline-flex items-center px-3 py-1 border border-red-300 shadow-sm text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </div>
          </li>
        ))}
        {dataSources?.length === 0 && (
          <li className="px-4 py-8 text-center text-gray-500">
            No data sources connected yet
          </li>
        )}
      </ul>
    </div>
  );
};

export default DataSourcesList;
