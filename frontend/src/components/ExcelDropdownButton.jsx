import { useState, useRef, useEffect } from 'react'

/**
 * 엑셀 저장 드롭다운 버튼
 * 클릭 시 FS / FT 선택 드롭다운이 펼쳐집니다.
 *
 * Props:
 *   onSelect(type: 'fs' | 'ft') — 선택된 타입을 부모로 전달
 *   style — 버튼에 추가할 인라인 스타일 (optional)
 *   className — 버튼 className (optional)
 *   label — 버튼 기본 라벨 (optional, 기본값 '📊 엑셀 저장')
 */
export function ExcelDropdownButton({ onSelect, style = {}, className = '', label = '📊 엑셀 저장' }) {
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef(null)

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (type) => {
    setOpen(false)
    onSelect(type)
  }

  return (
    <div ref={wrapperRef} style={{ position: 'relative', display: 'inline-block' }}>
      {/* 메인 버튼 */}
      <button
        className={`btn-excel-dropdown ${className}`}
        style={style}
        onClick={() => setOpen((prev) => !prev)}
        title="엑셀 저장 형식 선택"
      >
        {label}
        <span className={`btn-excel-caret ${open ? 'open' : ''}`}>▾</span>
      </button>

      {/* 드롭다운 메뉴 */}
      {open && (
        <div className="excel-dropdown-menu">
          <button
            className="excel-dropdown-item excel-fs"
            onClick={() => handleSelect('fs')}
          >
            <span className="item-icon">📋</span>
            <span className="item-info">
              <strong>FS 기준</strong>
              <small>기능 요건정의 산정</small>
            </span>
          </button>
          <button
            className="excel-dropdown-item excel-ft"
            onClick={() => handleSelect('ft')}
          >
            <span className="item-icon">⚡</span>
            <span className="item-info">
              <strong>FT 기준</strong>
              <small>기능 테스트 시나리오 산정</small>
            </span>
          </button>
        </div>
      )}
    </div>
  )
}

export default ExcelDropdownButton
