import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

interface AdminDebugProps {
  listings: any[];
  users: any[];
  stats: any;
  loading: boolean;
}

const AdminDebug: React.FC<AdminDebugProps> = ({ listings, users, stats, loading }) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Debug Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Loading State:</h3>
            <Badge className={loading ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}>
              {loading ? 'Loading...' : 'Loaded'}
            </Badge>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">Listings Count:</h3>
            <p className="text-lg font-bold text-blue-600">{listings.length}</p>
            {listings.length > 0 && (
              <div className="mt-2">
                <h4 className="font-medium mb-1">Listing Status Breakdown:</h4>
                <div className="space-y-1">
                  {Object.entries(
                    listings.reduce((acc, listing) => {
                      acc[listing.status] = (acc[listing.status] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>)
                  ).map(([status, count]) => (
                    <div key={status} className="flex items-center space-x-2">
                      <Badge variant="outline">{status}</Badge>
                      <span>{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">Users Count:</h3>
            <p className="text-lg font-bold text-green-600">{users.length}</p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">Stats:</h3>
            <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
              {JSON.stringify(stats, null, 2)}
            </pre>
          </div>
          
          {listings.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Sample Listings:</h3>
              <div className="space-y-2">
                {listings.slice(0, 3).map((listing, index) => (
                  <div key={listing.id || index} className="bg-gray-50 p-3 rounded">
                    <div className="font-medium">{listing.title || 'No title'}</div>
                    <div className="text-sm text-gray-600">
                      Status: {listing.status || 'Unknown'} | 
                      Verified: {listing.verified ? 'Yes' : 'No'} | 
                      Type: {listing.type || 'Unknown'} | 
                      Category: {listing.category || 'Unknown'}
                    </div>
                    {listing.owner && (
                      <div className="text-sm text-gray-500">
                        Owner: {listing.owner.full_name || 'Unknown'}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDebug;
