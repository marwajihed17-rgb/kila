import { FileText, Package, BarChart3, Receipt, LogOut, User as UserIcon, MessageCircle } from 'lucide-react';
import { Button } from './ui/button';
import logo from 'figma:asset/220dab80c3731b3a44f7ce1394443acd5caffa99.png';
import { User } from '../types/api';
import { useEffect, useState } from 'react';

interface DashboardProps {
  onNavigate: (page: 'invoice' | 'kdr' | 'ga' | 'kdr-invoicing' | 'chat') => void;
  onLogout: () => void;
}

export function Dashboard({ onNavigate, onLogout }: DashboardProps) {
  const [userModules, setUserModules] = useState<string[]>([]);
  const [username, setUsername] = useState<string>('');

  useEffect(() => {
    // Get user modules and username from localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user: User = JSON.parse(userStr);
        setUserModules(user.modules || []);
        setUsername(user.username || '');
      } catch (error) {
        console.error('Failed to parse user data:', error);
      }
    }
  }, []);

  const cards = [
    {
      id: 'chat' as const,
      icon: MessageCircle,
      title: 'AI Chat Assistant',
      description: 'Real-time AI assistance with streaming responses',
      moduleKey: 'chat',
    },
    {
      id: 'invoice' as const,
      icon: FileText,
      title: 'Invoice with Automation',
      description: 'Automated invoice processing',
      moduleKey: 'invoice',
    },
    {
      id: 'kdr' as const,
      icon: Package,
      title: 'KDR Processing',
      description: 'Manage KDR workflows efficiently',
      moduleKey: 'kdr',
    },
    {
      id: 'ga' as const,
      icon: BarChart3,
      title: 'GA Processing',
      description: 'Analytics and reporting automation',
      moduleKey: 'ga',
    },
    {
      id: 'kdr-invoicing' as const,
      icon: Receipt,
      title: 'KDR Invoicing',
      description: 'KDR invoice management and tracking',
      moduleKey: 'kdr invoicing',
    },
  ];

  const hasAccess = (moduleKey: string) => {
    return userModules.includes(moduleKey.toLowerCase());
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-[#2a3144] bg-[#0f1419]/50 backdrop-blur-md">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <img src={logo} alt="Retaam Solutions" className="h-10" />
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-white">
              <UserIcon className="w-5 h-5" />
              <span className="text-sm">{username}</span>
            </div>
            <Button
              variant="ghost"
              onClick={onLogout}
              className="text-white hover:bg-[#1a1f2e] gap-2 h-9 px-3"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {cards.map((card) => {
            const Icon = card.icon;
            const canAccess = hasAccess(card.moduleKey);
            return (
              <button
                key={card.id}
                onClick={() => canAccess && onNavigate(card.id)}
                disabled={!canAccess}
                className={`bg-[#1a1f2e]/80 backdrop-blur-sm border border-[#2a3144] rounded-lg p-6 transition-all group relative overflow-hidden ${
                  canAccess
                    ? 'hover:border-[#3a4154] hover:bg-[#1a1f2e]/90 cursor-pointer'
                    : 'cursor-not-allowed'
                }`}
              >
                <div className={`flex flex-col items-center text-center space-y-3 ${!canAccess ? 'blur-sm' : ''}`}>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#4A90F5] to-[#C74AFF] flex items-center justify-center animated-gradient">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white mb-1">{card.title}</h3>
                    <p className="text-gray-400 text-sm">{card.description}</p>
                  </div>
                </div>
                {/* Enhanced blur overlay layer */}
                {!canAccess && (
                  <div className="absolute inset-0 bg-gray-500/50 backdrop-blur-md rounded-lg pointer-events-none z-10"></div>
                )}
              </button>
            );
          })}
        </div>
      </main>
      
      {/* Signature */}
      <div className="fixed bottom-4 right-4">
        <div className="flex items-center gap-4">
          <div className="h-0.5 w-64 bg-gradient-to-r from-[#4A90F5] to-[#C74AFF] animated-gradient"></div>
          <div className="text-right">
            <p className="text-gray-400 text-sm">PAA--Solutions Tool</p>
            <p className="text-gray-500 text-xs">WWW.PAA-Solutions.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}