import React, { useState, useEffect } from 'react';
import { BarChart3, MapPin, Target, Upload, Clock, User, Building2 } from 'lucide-react';
import { employeesAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const AnalysisPage = () => {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [branchCount, setBranchCount] = useState(3);
  const [maxDistance, setMaxDistance] = useState(30);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [bulkAnalysisResult, setBulkAnalysisResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [bulkStrategy, setBulkStrategy] = useState('closest');
  const [bulkMaxDistance, setBulkMaxDistance] = useState(50);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setPageLoading(true);
      const response = await employeesAPI.getAll();
      setEmployees(response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setPageLoading(false);
    }
  };

  const performSingleAnalysis = async () => {
    if (!selectedEmployee) {
      alert('Lütfen bir çalışan seçin!');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:5002/api/calisanlar/${selectedEmployee}/en-yakin-subeler?n=${branchCount}&maxDistance=${maxDistance}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken') || localStorage.getItem('token')}`
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Analiz işlemi başarısız');
      }
      
      const data = await response.json();
      setAnalysisResult(data);
    } catch (error) {
      console.error('Analysis error:', error);
      alert('Analiz işlemi sırasında hata oluştu!');
    } finally {
      setLoading(false);
    }
  };

  const performBulkAnalysis = async () => {
    try {
      setBulkLoading(true);
      setAnalysisResult(null); // Clear single analysis
      
      console.log('Starting bulk analysis...');
      console.log('Request data:', { strategy: bulkStrategy, maxDistance: bulkMaxDistance });
      
      const response = await fetch('http://localhost:5002/api/test/bulk-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
          // Auth removed for test endpoint
        },
        body: JSON.stringify({
          strategy: bulkStrategy,
          maxDistance: bulkMaxDistance,
          branchCount: 3
        })
      });
      
      console.log('Response status:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Toplu analiz işlemi başarısız: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Success data:', data);
      setBulkAnalysisResult(data);
    } catch (error) {
      console.error('Bulk analysis error:', error);
      alert(`Toplu analiz işlemi sırasında hata oluştu: ${error.message}`);
    } finally {
      setBulkLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
        <p className="ml-3 text-gray-600">Sayfa yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mesafe Analizi</h1>
          <p className="mt-1 text-sm text-gray-500">
            Çalışanlar için en yakın şubeleri bulun ve akıllı atama yapın
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="btn btn-outline">
            <Upload className="w-4 h-4 mr-2" />
            Toplu Analiz
          </button>
        </div>
      </div>

      {/* Analysis Options */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Tekli Analiz</h3>
            <p className="card-description">
              Tek çalışan için en yakın şubeleri bul
            </p>
          </div>
          <div className="card-content space-y-4">
            <div>
              <label className="label">Çalışan Seç</label>
              <select 
                className="input"
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
              >
                <option value="">Çalışan seçin...</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.ad} {emp.soyad} - {emp.acik_adres}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Şube Sayısı</label>
              <select 
                className="input"
                value={branchCount}
                onChange={(e) => setBranchCount(parseInt(e.target.value))}
              >
                <option value={3}>En yakın 3 şube</option>
                <option value={5}>En yakın 5 şube</option>
                <option value={10}>En yakın 10 şube</option>
              </select>
            </div>
            <div>
              <label className="label">Maksimum Mesafe (km)</label>
              <input 
                type="number" 
                className="input" 
                placeholder="30" 
                value={maxDistance}
                onChange={(e) => setMaxDistance(parseInt(e.target.value) || 30)}
              />
            </div>
            <button 
              className="btn btn-primary w-full"
              onClick={performSingleAnalysis}
              disabled={loading || !selectedEmployee}
            >
              {loading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <Target className="w-4 h-4 mr-2" />
              )}
              {loading ? 'Analiz yapılıyor...' : 'Analiz Yap'}
            </button>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Toplu Analiz</h3>
            <p className="card-description">
              Tüm çalışanlar için otomatik atama
            </p>
          </div>
          <div className="card-content space-y-4">
            <div>
              <label className="label">Atama Stratejisi</label>
              <select 
                className="input"
                value={bulkStrategy}
                onChange={(e) => setBulkStrategy(e.target.value)}
              >
                <option value="closest">En yakın şube öncelikli</option>
                <option value="balanced">Kapasite dengeleyici</option>
                <option value="hybrid">Hibrit (mesafe + kapasite)</option>
              </select>
            </div>
            <div>
              <label className="label">Maksimum Mesafe (km)</label>
              <input 
                type="number" 
                className="input" 
                placeholder="50" 
                value={bulkMaxDistance}
                onChange={(e) => setBulkMaxDistance(parseInt(e.target.value) || 50)}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" id="prioritizeDistance" className="rounded" />
              <label htmlFor="prioritizeDistance" className="text-sm text-gray-700">
                Mesafeyi öncelendir
              </label>
            </div>
            <button 
              className="btn btn-success w-full"
              onClick={performBulkAnalysis}
              disabled={bulkLoading}
            >
              {bulkLoading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <BarChart3 className="w-4 h-4 mr-2" />
              )}
              {bulkLoading ? 'Analiz yapılıyor...' : 'Toplu Atama Yap'}
            </button>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Analiz Sonuçları</h3>
          <p className="card-description">
            Mesafe hesaplamaları ve atama önerileri
          </p>
        </div>
        <div className="card-content">
          {bulkAnalysisResult ? (
            <div className="space-y-6">
              {/* Bulk Analysis Summary */}
              <div className="bg-gradient-to-r from-green-500 to-blue-500 rounded-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xl font-bold mb-2">Toplu Analiz Tamamlandı</h4>
                    <p className="opacity-90">
                      {bulkAnalysisResult.stats.analyzedEmployees}/{bulkAnalysisResult.stats.totalEmployees} çalışan analiz edildi
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">
                      {bulkAnalysisResult.stats.averageDistance} km
                    </p>
                    <p className="opacity-90">Ortalama Mesafe</p>
                  </div>
                </div>
              </div>

              {/* Bulk Results Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Çalışan
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Atanan Şube
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Mesafe
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Kapasite
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {bulkAnalysisResult.results.map((result, index) => (
                      <tr key={result.employee.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <User className="h-5 w-5 text-blue-600" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {result.employee.name}
                              </div>
                              <div className="text-sm text-gray-500 truncate max-w-xs">
                                {result.employee.address}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8">
                              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                                <Building2 className="h-4 w-4 text-green-600" />
                              </div>
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">
                                {result.selectedBranch.name}
                              </div>
                              <div className="text-sm text-gray-500 truncate max-w-xs">
                                {result.selectedBranch.address}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-900">
                            <MapPin className="h-4 w-4 mr-1 text-purple-500" />
                            {result.selectedBranch.distance_km.toFixed(2)} km
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-900">
                            <User className="h-4 w-4 mr-1 text-blue-500" />
                            {result.selectedBranch.capacity}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Bulk Analysis Stats */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                <div className="bg-gradient-to-r from-blue-400 to-blue-600 rounded-lg p-4 text-white">
                  <div className="flex items-center">
                    <User className="w-8 h-8 mr-3" />
                    <div>
                      <p className="text-blue-100 text-sm">Analiz Edilen</p>
                      <p className="text-lg font-semibold">
                        {bulkAnalysisResult.stats.analyzedEmployees}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-green-400 to-green-600 rounded-lg p-4 text-white">
                  <div className="flex items-center">
                    <Target className="w-8 h-8 mr-3" />
                    <div>
                      <p className="text-green-100 text-sm">Ortalama Mesafe</p>
                      <p className="text-lg font-semibold">
                        {bulkAnalysisResult.stats.averageDistance} km
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-purple-400 to-purple-600 rounded-lg p-4 text-white">
                  <div className="flex items-center">
                    <Building2 className="w-8 h-8 mr-3" />
                    <div>
                      <p className="text-purple-100 text-sm">Strateji</p>
                      <p className="text-lg font-semibold capitalize">
                        {bulkAnalysisResult.stats.strategy}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-orange-400 to-orange-600 rounded-lg p-4 text-white">
                  <div className="flex items-center">
                    <MapPin className="w-8 h-8 mr-3" />
                    <div>
                      <p className="text-orange-100 text-sm">Max Mesafe</p>
                      <p className="text-lg font-semibold">
                        {bulkAnalysisResult.stats.maxDistance} km
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : analysisResult ? (
            <div className="space-y-6">
              {/* Employee Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center">
                  <User className="w-6 h-6 text-blue-600 mr-3" />
                  <div>
                    <h4 className="font-medium text-blue-900">
                      {analysisResult.employee.name}
                    </h4>
                    <p className="text-sm text-blue-700">
                      Analiz tamamlandı - {analysisResult.count} şube bulundu
                    </p>
                  </div>
                </div>
              </div>

              {/* Results Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Şube
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Kapasite
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Kuş Uçuşu Mesafe
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Yol Mesafesi
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Seyahat Süresi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {analysisResult.nearestBranches.map((branch, index) => (
                      <tr key={branch.id} className={index === 0 ? 'bg-green-50' : 'hover:bg-gray-50'}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                                index === 0 ? 'bg-green-100' : 'bg-gray-100'
                              }`}>
                                <Building2 className={`h-5 w-5 ${
                                  index === 0 ? 'text-green-600' : 'text-gray-600'
                                }`} />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {branch.ad}
                                {index === 0 && (
                                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    En Yakın
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-gray-500 truncate max-w-xs">
                                {branch.adres}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-1 text-blue-500" />
                            {branch.norm_kadro}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1 text-purple-500" />
                            {branch.distance_km.toFixed(2)} km
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1 text-orange-500" />
                            {branch.road_distance_km} km
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1 text-green-500" />
                            {branch.travel_time_minutes} dk
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="bg-gradient-to-r from-green-400 to-green-600 rounded-lg p-4 text-white">
                  <div className="flex items-center">
                    <Target className="w-8 h-8 mr-3" />
                    <div>
                      <p className="text-green-100 text-sm">En Yakın Şube</p>
                      <p className="text-lg font-semibold">
                        {analysisResult.nearestBranches[0]?.road_distance_km} km
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-blue-400 to-blue-600 rounded-lg p-4 text-white">
                  <div className="flex items-center">
                    <Clock className="w-8 h-8 mr-3" />
                    <div>
                      <p className="text-blue-100 text-sm">En Kısa Süre</p>
                      <p className="text-lg font-semibold">
                        {analysisResult.nearestBranches[0]?.travel_time_minutes} dk
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-purple-400 to-purple-600 rounded-lg p-4 text-white">
                  <div className="flex items-center">
                    <Building2 className="w-8 h-8 mr-3" />
                    <div>
                      <p className="text-purple-100 text-sm">Bulunan Şube</p>
                      <p className="text-lg font-semibold">
                        {analysisResult.count} adet
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Analiz sonucu burada görünecek
              </h3>
              <p className="text-gray-500 mb-6">
                Bir çalışan seçip analiz yapın veya toplu analiz başlatın
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 inline-block">
                <div className="flex items-center text-blue-800">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  <span className="text-sm font-medium">
                    PostGIS ile yüksek performanslı mesafe hesaplama
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Nasıl Çalışır?</h3>
        </div>
        <div className="card-content">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="text-center">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-600 font-semibold">1</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">PostGIS Hesaplama</h4>
              <p className="text-sm text-gray-600">
                Veritabanında ST_Distance fonksiyonu ile hızlı mesafe hesaplama
              </p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-green-600 font-semibold">2</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Google Distance Matrix</h4>
              <p className="text-sm text-gray-600">
                Gerçek yol mesafesi ve seyahat süresi hesaplama
              </p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-purple-600 font-semibold">3</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Akıllı Atama</h4>
              <p className="text-sm text-gray-600">
                Kapasite ve mesafe dengeleyerek optimal atama
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisPage;