import { useState } from 'react'

export function ShareButton({ analysis }) {
  const [shareUrl, setShareUrl] = useState(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    if (!analysis) {
      alert('분석 데이터가 없습니다')
      return
    }

    setLoading(true)
    try {
      const BASE = (() => {
  let url = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001';
  if (url.endsWith('/api')) url = url.slice(0, -4);
  if (url.endsWith('/api/')) url = url.slice(0, -5);
  return url;
})();
      const response = await fetch(`${BASE}/api/shares/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          process_name: analysis.process_name,
          analysis_data: analysis
        })
      })

      const data = await response.json()
      
      if (data.status === 'success') {
        const fullUrl = `${window.location.origin}/share/${data.share_id}`
        setShareUrl(fullUrl)
      } else {
        alert('공유 링크 생성 실패')
      }
    } catch (error) {
      console.error('공유 실패:', error)
      alert('공유 중 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyUrl = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="share-button-container">
      <button 
        onClick={handleShare}
        disabled={loading}
        className="btn-share"
      >
        {loading ? '공유 중...' : '🔗 공유하기'}
      </button>

      {shareUrl && (
        <div className="share-result">
          <input 
            type="text" 
            value={shareUrl} 
            readOnly 
            className="share-url-input"
          />
          <button 
            onClick={handleCopyUrl}
            className="btn-copy"
          >
            {copied ? '✓ 복사됨!' : '복사'}
          </button>
        </div>
      )}
    </div>
  )
}

export default ShareButton
