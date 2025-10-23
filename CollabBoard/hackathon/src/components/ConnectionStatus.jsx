import { useSocketStore } from '../store/socketStore'
import { FaWifi, FaExclamationTriangle } from 'react-icons/fa'

function ConnectionStatus() {
  const { connectionStatus } = useSocketStore()

  const statusConfig = {
    connected: {
      color: 'bg-green-500',
      icon: <FaWifi />,
      text: 'Connected',
      textColor: 'text-green-600 dark:text-green-400'
    },
    connecting: {
      color: 'bg-yellow-500 animate-pulse',
      icon: <FaWifi />,
      text: 'Connecting...',
      textColor: 'text-yellow-600 dark:text-yellow-400'
    },
    disconnected: {
      color: 'bg-red-500',
      icon: <FaExclamationTriangle />,
      text: 'Disconnected',
      textColor: 'text-red-600 dark:text-red-400'
    },
    error: {
      color: 'bg-red-500 animate-pulse',
      icon: <FaExclamationTriangle />,
      text: 'Connection Error',
      textColor: 'text-red-600 dark:text-red-400'
    }
  }

  const config = statusConfig[connectionStatus] || statusConfig.disconnected

  return (
    <div 
      className="fixed top-20 left-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border-2 border-gray-200 dark:border-gray-700 px-3 py-2 z-50 hover:scale-105 transition-transform cursor-help"
      title={connectionStatus === 'connected' ? 'Real-time collaboration is active. All changes are synced instantly!' : 'Trying to connect to collaboration server...'}
    >
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${config.color}`}></div>
        <div className="flex items-center gap-2">
          <span className={config.textColor}>{config.icon}</span>
          <span className={`text-xs font-semibold ${config.textColor}`}>
            {config.text}
          </span>
        </div>
      </div>
      {connectionStatus === 'connected' && (
        <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
          Live collaboration active
        </div>
      )}
    </div>
  )
}

export default ConnectionStatus
