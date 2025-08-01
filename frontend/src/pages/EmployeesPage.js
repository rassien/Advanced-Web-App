import React, { useState, useEffect } from 'react';
import { Users, Plus, Upload, X, MapPin, Clock } from 'lucide-react';
import { employeesAPI } from '../services/api';
import ExcelUpload from '../components/ExcelUpload';
import LoadingSpinner from '../components/LoadingSpinner';

const EmployeesPage = () => {
  const [showExcelUpload, setShowExcelUpload] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    geocoded: 0,
    assigned: 0
  });

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await employeesAPI.getAll();
      const employeeData = response.data;
      setEmployees(employeeData);
      
      // Calculate stats
      const geocodedCount = employeeData.filter(emp => emp.latitude && emp.longitude).length;
      setStats({
        total: employeeData.length,
        geocoded: geocodedCount,
        assigned: 0 // TODO: Get assignment count from assignments API
      });
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleExcelUploadSuccess = (result) => {
    console.log('Excel upload successful:', result);
    setShowExcelUpload(false);
    fetchEmployees(); // Refresh employee list
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Çalışanlar</h1>
          <p className="mt-1 text-sm text-gray-500">
            Çalışan bilgilerini yönetin ve adres bilgilerini kaydedin
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
            Yeni Çalışan
          </button>
        </div>
      </div>

      {/* Excel Upload Modal */}
      {showExcelUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Çalışan Excel Yükleme
              </h3>
              <button
                onClick={() => setShowExcelUpload(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <ExcelUpload
              endpoint="/calisanlar/upload-excel"
              title="Çalışan Excel Dosyası Yükle"
              description="Çalışan bilgilerini Excel dosyasından toplu olarak yükleyin"
              sampleColumns={['ad', 'soyad', 'acik_adres', 'tckn (opsiyonel)']}
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
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Toplam Çalışan</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-content p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Geocoded</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.geocoded}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-content p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-purple-600 rounded-full"></div>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Atanmış</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.assigned}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Employee List */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Çalışan Listesi</h3>
          <p className="card-description">
            Tüm çalışanlar ve konum bilgileri
          </p>
        </div>
        <div className="card-content">
          {loading ? (
            <div className="text-center py-12">
              <LoadingSpinner size="lg" />
              <p className="mt-4 text-sm text-gray-600">Çalışanlar yükleniyor...</p>
            </div>
          ) : employees.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Henüz çalışan eklenmemiş
              </h3>
              <p className="text-gray-500 mb-6">
                Çalışan eklemek için yukarıdaki butonları kullanın
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
                      Çalışan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      TCKN
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Adres
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
                  {employees.map((employee) => (
                    <tr key={employee.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <Users className="h-5 w-5 text-blue-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {employee.ad} {employee.soyad}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {employee.tckn || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {employee.acik_adres}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {employee.latitude && employee.longitude ? (
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
                          {new Date(employee.created_at).toLocaleDateString('tr-TR')}
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

export default EmployeesPage;