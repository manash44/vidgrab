import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import {
  Clipboard,
  X,
  Download,
  AlertCircle,
  Loader2,
  History,
  Smartphone,
  Save,
  FileVideo,
  Music,
  Settings,
  Server,
  Check,
  Video,
  Headphones,
  CheckCircle
} from 'lucide-react'
import './App.css'

function App() {
  // Tabs: 'video' or 'audio'
  const [activeTab, setActiveTab] = useState('video')

  const [url, setUrl] = useState('')
  const [quality, setQuality] = useState('best')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(null)
  const [history, setHistory] = useState([])
  const [taskId, setTaskId] = useState(null)

  // PWA & Settings
  const [installPrompt, setInstallPrompt] = useState(null)
  const [showInstallBanner, setShowInstallBanner] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [serverUrl, setServerUrl] = useState('')
  const [serverUrlInput, setServerUrlInput] = useState('')
  const [connectionStatus, setConnectionStatus] = useState('unknown')

  const pollIntervalRef = useRef(null)
  const inputRef = useRef(null)

  // Load server URL
  useEffect(() => {
    const savedServerUrl = localStorage.getItem('vidgrab_server_url')
    if (savedServerUrl) {
      setServerUrl(savedServerUrl)
      setServerUrlInput(savedServerUrl)
    }
  }, [])

  // Get API URL
  const getApiUrl = () => {
    return serverUrl || import.meta.env.VITE_API_URL || window.location.origin
  }

  // Test Connection
  const testConnection = async (urlToTest) => {
    setConnectionStatus('checking')
    try {
      await axios.get(`${urlToTest}/status/test`, { timeout: 5000 })
      setConnectionStatus('connected')
      return true
    } catch (error) {
      if (error.response) {
        setConnectionStatus('connected')
        return true
      }
      setConnectionStatus('error')
      return false
    }
  }

  // Save Server URL
  const saveServerUrl = async () => {
    let urlToSave = serverUrlInput.trim().replace(/\/$/, '')
    if (urlToSave && !/^https?:\/\//.test(urlToSave)) {
      urlToSave = `http://${urlToSave}`
    }

    if (urlToSave) {
      const isConnected = await testConnection(urlToSave)
      if (isConnected) {
        setServerUrl(urlToSave)
        setServerUrlInput(urlToSave)
        localStorage.setItem('vidgrab_server_url', urlToSave)
        setTimeout(() => setShowSettings(false), 500)
      }
    } else {
      setServerUrl('')
      localStorage.removeItem('vidgrab_server_url')
      setConnectionStatus('unknown')
      setShowSettings(false)
    }
  }

  // History Sync
  useEffect(() => {
    const savedHistory = localStorage.getItem('vidgrab_history')
    if (savedHistory) setHistory(JSON.parse(savedHistory))
  }, [])

  useEffect(() => {
    localStorage.setItem('vidgrab_history', JSON.stringify(history))
  }, [history])

  // PWA
  useEffect(() => {
    const handleBeforeInstall = (e) => {
      e.preventDefault()
      setInstallPrompt(e)
      setTimeout(() => setShowInstallBanner(true), 2000)
    }
    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
  }, [])

  // Polling
  useEffect(() => {
    if (taskId) {
      pollIntervalRef.current = setInterval(async () => {
        try {
          const res = await axios.get(`${getApiUrl()}/status/${taskId}`)
          const data = res.data
          setStatus(data)

          if (data.status === 'ready' || data.status === 'error') {
            clearInterval(pollIntervalRef.current)
            setLoading(false)
            if (data.status === 'ready') {
              addToHistory(url, data.filename || 'Download', new Date().toLocaleString())
            }
          }
        } catch (err) {
          console.error("Polling error", err)
        }
      }, 1000)
    }
    return () => pollIntervalRef.current && clearInterval(pollIntervalRef.current)
  }, [taskId, url])

  const addToHistory = (link, filename, date) => {
    setHistory(prev => [{ link, filename, date, type: activeTab }, ...prev].slice(0, 15))
  }

  const handleDownload = async (e) => {
    e.preventDefault()
    if (!url) return

    setLoading(true)
    setStatus({ status: 'queued', message: 'Starting download...' })
    setTaskId(null)

    try {
      const response = await axios.post(`${getApiUrl()}/download`, {
        url,
        format: activeTab, // 'video' or 'audio'
        quality: activeTab === 'audio' ? 'best' : quality
      })
      setTaskId(response.data.task_id)
    } catch (error) {
      console.error(error)
      const errorMsg = error.response?.data?.message || 'Failed to connect to server.'
      setStatus({ status: 'error', message: errorMsg })
      setLoading(false)
    }
  }

  const handleSaveFile = () => {
    if (!taskId || status?.status !== 'ready') return
    const link = document.createElement('a')
    link.href = `${getApiUrl()}/file/${taskId}`
    link.download = status.filename || 'video'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // Reset after save
    setTimeout(() => {
      setStatus(null)
      setTaskId(null)
      setUrl('')
    }, 1500)
  }

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      setUrl(text)
      inputRef.current?.focus()
    } catch (err) {
      console.error('Failed to read clipboard', err)
    }
  }

  const handleInstall = async () => {
    if (!installPrompt) return
    installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === 'accepted') setInstallPrompt(null)
    setShowInstallBanner(false)
  }

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="logo-container">
          <div className="logo-icon">
            <span className="logo-x">XH</span>
          </div>
          <div className="logo-text">
            <h1>MASTER</h1>
            <span className="logo-subtitle">Video Downloader & Converter</span>
          </div>
        </div>

        <button
          className={`settings-btn ${showSettings ? 'active' : ''}`}
          onClick={() => {
            setShowSettings(true)
            setConnectionStatus('unknown')
          }}
        >
          <Settings size={20} />
        </button>
      </header>

      {/* Main Content Area */}
      <main className="main-content">

        {/* Settings Modal */}
        {showSettings && (
          <div className="modal-overlay" onClick={() => setShowSettings(false)}>
            <div className="modal-content glass-panel" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3><Server size={18} /> Server Connection</h3>
                <button onClick={() => setShowSettings(false)}><X size={18} /></button>
              </div>
              <div className="modal-body">
                <p className="hint-text">Enter the URL of your Backend Server.</p>
                <div className="input-group">
                  <input
                    type="text"
                    value={serverUrlInput}
                    onChange={e => {
                      setServerUrlInput(e.target.value)
                      setConnectionStatus('unknown')
                    }}
                    placeholder="http://localhost:5000"
                    className="modal-input"
                  />
                </div>
                {connectionStatus === 'connected' && <div className="status-badge success"><Check size={14} /> Connected</div>}
                {connectionStatus === 'error' && <div className="status-badge error"><AlertCircle size={14} /> Connection Failed</div>}

                <button className="primary-btn full-width" onClick={saveServerUrl}>
                  {connectionStatus === 'checking' ? <Loader2 size={18} className="animate-spin" /> : 'Save & Connect'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="tab-switcher">
          <button
            className={`tab-btn ${activeTab === 'video' ? 'active' : ''}`}
            onClick={() => setActiveTab('video')}
          >
            <Video size={18} />
            <span>Video Downloader</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'audio' ? 'active' : ''}`}
            onClick={() => setActiveTab('audio')}
          >
            <Headphones size={18} />
            <span>YouTube to MP3</span>
          </button>
        </div>

        {/* Downloader Card */}
        <div className="downloader-card glass-panel">
          <form onSubmit={handleDownload}>
            <div className="url-input-container">
              <input
                ref={inputRef}
                type="url"
                className="main-url-input"
                placeholder={activeTab === 'video' ? "Paste video URL..." : "Paste YouTube URL for MP3..."}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={loading}
              />
              <div className="input-tools">
                {url && <button type="button" onClick={() => setUrl('')}><X size={18} /></button>}
                <button type="button" onClick={handlePaste}><Clipboard size={18} /></button>
              </div>
            </div>

            {/* Quality Options (Video Only) */}
            {activeTab === 'video' && (
              <div className="options-container">
                <label>Quality:</label>
                <select value={quality} onChange={e => setQuality(e.target.value)} disabled={loading}>
                  <option value="best">Best Available</option>
                  <option value="1080">Full HD (1080p)</option>
                  <option value="720">HD (720p)</option>
                  <option value="480">Standard (480p)</option>
                  <option value="360">Data Saver (360p)</option>
                </select>
              </div>
            )}

            {/* Main Action Button */}
            {!status || status.status !== 'ready' ? (
              <button
                type="submit"
                className={`action-btn ${loading ? 'loading' : ''}`}
                disabled={!url || loading}
              >
                {loading ? <Loader2 className="animate-spin" /> : <Download />}
                {loading ? 'Processing...' : (activeTab === 'audio' ? 'Convert to MP3' : 'Download Video')}
              </button>
            ) : (
              <button type="button" className="action-btn success" onClick={handleSaveFile}>
                <Save />
                Save {status.filename} ({status.file_size_str})
              </button>
            )}
          </form>

          {/* Status Display */}
          {status && (
            <div className={`status-display ${status.status}`}>
              <div className="status-main">
                {status.status === 'downloading' && <div className="loader-ring"></div>}
                {status.status === 'error' && <AlertCircle className="error-icon" />}
                {status.status === 'ready' && <CheckCircle className="success-icon" />}
                <div className="status-info">
                  <span className="status-message">{status.message}</span>
                  {status.status === 'downloading' && (
                    <div className="progress-details">
                      <div className="progress-bar-container">
                        <div className="progress-bar-fill" style={{ width: `${status.progress}%` }}></div>
                      </div>
                      <div className="progress-stats">
                        <span>{status.progress.toFixed(1)}%</span>
                        <span>{status.speed}</span>
                        <span>{status.eta}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Logs */}
              {status.logs && status.logs.length > 0 && (
                <div className="logs-preview">
                  {status.logs.slice(-2).map((log, i) => (
                    <div key={i} className="log-line-small">{log}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Recent History */}
        {history.length > 0 && (
          <div className="history-section">
            <h3 className="section-title"><History size={16} /> Recent Downloads</h3>
            <div className="history-list">
              {history.map((item, i) => (
                <div key={i} className="history-card glass-panel" onClick={() => setUrl(item.link)}>
                  <div className="history-icon">
                    {item.type === 'audio' ? <Music size={16} /> : <FileVideo size={16} />}
                  </div>
                  <div className="history-info">
                    <div className="history-name" title={item.filename}>{item.filename}</div>
                    <div className="history-date">{item.date}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* Install Banner */}
      {showInstallBanner && (
        <div className="install-banner glass-panel">
          <div className="install-info">
            <Smartphone size={24} />
            <div>
              <strong>Install App</strong>
              <p>Add to home screen</p>
            </div>
          </div>
          <div className="install-actions">
            <button onClick={() => setShowInstallBanner(false)}>Later</button>
            <button className="primary-btn small" onClick={handleInstall}>Install</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
