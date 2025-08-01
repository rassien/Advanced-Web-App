import React from 'react';
import { Users, Building2, GitBranch, BarChart3, MapPin } from 'lucide-react';

const DashboardPage = () => {
  const stats = [
    {
      name: 'Toplam Çalışan',
      value: '0',
      icon: Users,
      color: 'bg-blue-500',
      href: '/employees'
    },
    {
      name: 'Toplam Şube',
      value: '0', 
      icon: Building2,
      color: 'bg-green-500',
      href: '/branches'
    },
    {
      name: 'Aktif Atama',
      value: '0',
      icon: GitBranch,
      color: 'bg-purple-500',
      href: '/assignments'
    },
    {
      name: 'Atama Oranı',
      value: '0%',
      icon: BarChart3,
      color: 'bg-orange-500',
      href: '/analysis'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Çalışan-Şube Atama Sistemi genel görünümü
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.name}
              className="card hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => window.location.href = stat.href}
            >
              <div className="card-content p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`w-12 h-12 rounded-lg ${stat.color} flex items-center justify-center`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">
                      {stat.name}
                    </p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {stat.value}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Hızlı İşlemler</h3>
            <p className="card-description">
              Sık kullanılan işlemlere hızlı erişim
            </p>
          </div>
          <div className="card-content space-y-3">
            <button 
              className="btn btn-outline w-full justify-start"
              onClick={() => window.location.href = '/employees'}
            >
              <Users className="w-4 h-4 mr-2" />
              Yeni Çalışan Ekle
            </button>
            <button 
              className="btn btn-outline w-full justify-start"
              onClick={() => window.location.href = '/branches'}
            >
              <Building2 className="w-4 h-4 mr-2" />
              Yeni Şube Ekle
            </button>
            <button 
              className="btn btn-outline w-full justify-start"
              onClick={() => window.location.href = '/analysis'}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Mesafe Analizi Yap
            </button>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Sistem Bilgileri</h3>
            <p className="card-description">
              Uygulama durumu ve özellikler
            </p>
          </div>
          <div className="card-content space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">PostgreSQL</span>
              <span className="badge badge-success">Aktif</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">PostGIS</span>
              <span className="badge badge-success">Aktif</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Google Maps API</span>
              <span className="badge badge-success">Aktif</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Geocoding</span>
              <span className="badge badge-success">Hazır</span>
            </div>
          </div>
        </div>
      </div>

      {/* Getting Started */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Başlarken</h3>
          <p className="card-description">
            Sistemi kullanmaya başlamak için bu adımları takip edin
          </p>
        </div>
        <div className="card-content">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="text-center p-4 rounded-lg bg-blue-50">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
              <h4 className="font-medium text-gray-900 mb-2">1. Şubeleri Ekleyin</h4>
              <p className="text-sm text-gray-600">
                Şube listesini Excel'den yükleyin veya tek tek ekleyin
              </p>
            </div>
            <div className="text-center p-4 rounded-lg bg-green-50">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <h4 className="font-medium text-gray-900 mb-2">2. Çalışanları Ekleyin</h4>
              <p className="text-sm text-gray-600">
                Çalışan bilgilerini ve adreslerini sisteme kaydedin
              </p>
            </div>
            <div className="text-center p-4 rounded-lg bg-purple-50">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <MapPin className="w-6 h-6 text-purple-600" />
              </div>
              <h4 className="font-medium text-gray-900 mb-2">3. Analiz Yapın</h4>
              <p className="text-sm text-gray-600">
                En yakın şubeleri bulun ve akıllı atama yapın
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;