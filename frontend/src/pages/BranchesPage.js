import React, { useState, useEffect } from 'react';
import { Building2, Plus, Upload, X, MapPin, Clock, Users } from 'lucide-react';
import { branchesAPI } from '../services/api';
import ExcelUpload from '../components/ExcelUpload';
import LoadingSpinner from '../components/LoadingSpinner';

const BranchesPage = () => {
  const [showExcelUpload, setShowExcelUpload] = useState(false);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    totalCapacity: 0,
    availableCapacity: 0
  });

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const response = await branchesAPI.getAll();
      const branchData = response.data;
      setBranches(branchData);
      
      // Calculate stats
      const totalCapacity = branchData.reduce((sum, branch) => sum + (branch.norm_kadro || 0), 0);
      setStats({
        total: branchData.length,
        totalCapacity,
        availableCapacity: totalCapacity // TODO: Subtract assigned employees count
      });
    } catch (error) {
      console.error('Error fetching branches:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const handleExcelUploadSuccess = (result) => {
    console.log('Excel upload successful:', result);
    setShowExcelUpload(false);
    fetchBranches(); // Refresh branch list
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Şubeler</h1>
          <p className="mt-1 text-sm text-gray-500">
            Şube bilgilerini yönetin ve kapasitelerini ayarlayın
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            className="btn btn-outline"
            onClick={() => setShowExcelUpload(true)}
          >
            <Upload className="w-4 h-4 mr-2" />
            Excel Yükle
          </button>
          <button className="btn btn-primary">
            <Plus className="w-4 h-4 mr-2" />
            Yeni Şube
          </button>
        </div>
      </div>

      {/* Excel Upload Modal */}
      {showExcelUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Şube Excel Yükleme
              </h3>
              <button
                onClick={() => setShowExcelUpload(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <ExcelUpload
              endpoint="/subeler/upload-excel"
              title="Şube Excel Dosyası Yükle"
              description="Şube bilgilerini Excel dosyasından toplu olarak yükleyin"
              sampleColumns={['ad', 'adres', 'norm_kadro']}
              onSuccess={handleExcelUploadSuccess}
            />
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="card">
          <div className="card-content p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Building2 className="w-8 h-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Toplam Şube</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-content p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Toplam Kapasite</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalCapacity}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-content p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-orange-600 rounded-full"></div>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Müsait Kapasite</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.availableCapacity}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Branch List */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Şube Listesi</h3>
          <p className="card-description">
            Tüm şubeler ve kapasite bilgileri
          </p>
        </div>
        <div className="card-content">
          {loading ? (
            <div className="text-center py-12">
              <LoadingSpinner size="lg" />
              <p className="mt-4 text-sm text-gray-600">Şubeler yükleniyor...</p>
            </div>
          ) : branches.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Henüz şube eklenmemiş
              </h3>
              <p className="text-gray-500 mb-6">
                Şube eklemek için yukarıdaki butonları kullanın
              </p>
              <div className="flex justify-center space-x-3">
                <button 
                  className="btn btn-outline"
                  onClick={() => setShowExcelUpload(true)}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Excel'den Yükle
                </button>
                <button className="btn btn-primary">
                  <Plus className="w-4 h-4 mr-2" />
                  Manuel Ekle
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Şube Adı
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Adres
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kapasite
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Konum
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kayıt Tarihi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {branches.map((branch) => (
                    <tr key={branch.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                              <Building2 className="h-5 w-5 text-green-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {branch.ad}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {branch.adres}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-blue-600">
                          <Users className="h-4 w-4 mr-1" />
                          {branch.norm_kadro || 0}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {branch.latitude && branch.longitude ? (
                          <div className="flex items-center text-sm text-green-600">
                            <MapPin className="h-4 w-4 mr-1" />
                            Geocoded
                          </div>
                        ) : (
                          <div className="flex items-center text-sm text-gray-400">
                            <MapPin className="h-4 w-4 mr-1" />
                            Yok
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {new Date(branch.created_at).toLocaleDateString('tr-TR')}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BranchesPage;