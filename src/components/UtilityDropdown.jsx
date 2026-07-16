import { useEffect, useRef } from 'react';
import '../styles/UtilityDropdown.css';

export default function UtilityDropdown({ isOpen, onClose, onOpenSettings, onOpenSteamSync, buttonRef }) {
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        isOpen &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, buttonRef]);

  if (!isOpen) return null;

  return (
    <div className="utility-dropdown" ref={dropdownRef}>
      <div className="dropdown-header">VAULT_UTILITIES_CONSOLE</div>
      <div className="dropdown-menu">
        <button
          type="button"
          className="dropdown-item"
          onClick={() => {
            onOpenSettings();
            onClose();
          }}
        >
          <span className="icon">⚙️</span>
          <span className="label">Settings Console</span>
        </button>

        <button
          type="button"
          className="dropdown-item"
          onClick={() => {
            onOpenSteamSync();
            onClose();
          }}
        >
          <span className="icon">🎮</span>
          <span className="label">Sync Steam Library</span>
        </button>

        <hr className="divider" />

        <div className="dropdown-subheader">FUTURE PROTOCOLS</div>

        <button type="button" className="dropdown-item disabled" disabled>
          <span className="icon">🟢</span>
          <span className="label">GOG Galaxy Sync</span>
          <span className="badge">OFFLINE</span>
        </button>

        <button type="button" className="dropdown-item disabled" disabled>
          <span className="icon">🔴</span>
          <span className="label">Epic Games Sync</span>
          <span className="badge">OFFLINE</span>
        </button>

        <button type="button" className="dropdown-item disabled" disabled>
          <span className="icon">🔵</span>
          <span className="label">PlayStation Sync</span>
          <span className="badge">OFFLINE</span>
        </button>

        <button type="button" className="dropdown-item disabled" disabled>
          <span className="icon">🟢</span>
          <span className="label">Xbox Live Sync</span>
          <span className="badge">OFFLINE</span>
        </button>
      </div>
    </div>
  );
}
