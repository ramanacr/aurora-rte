export interface RemotePeer {
  id: string;
  name: string;
  color: string;
  cursor?: { from: number; to: number };
  active?: boolean;
}

export interface PresenceManagerOptions {
  container: HTMLElement;
  currentUser?: { id: string; name: string; color: string };
  onBroadcastPresence?: (peer: RemotePeer) => void;
}

export interface PresenceManager {
  updatePeer: (peer: RemotePeer) => void;
  removePeer: (peerId: string) => void;
  getPeers: () => RemotePeer[];
  renderPresenceOverlay: (scrollParent?: HTMLElement) => void;
  destroy: () => void;
}

export const PRESET_PEER_COLORS = [
  '#FF2E93', // Vibrant Pink / Magenta (Alice)
  '#00F0FF', // Cyan / Aqua (Bob)
  '#00FF88', // Bright Emerald (Charlie)
  '#FFB703', // Amber Yellow
  '#9D4EDD'  // Electric Purple
];

/**
 * Creates and manages remote collaborative presence indicators (carets & selection bubbles).
 */
export function createPresenceManager(options: PresenceManagerOptions): PresenceManager {
  const peers = new Map<string, RemotePeer>();

  const overlay = document.createElement('div');
  overlay.className = 'aurora-presence-overlay';
  overlay.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    z-index: 50;
    overflow: hidden;
  `;

  if (options.container.style.position !== 'relative' && options.container.style.position !== 'absolute') {
    options.container.style.position = 'relative';
  }
  options.container.appendChild(overlay);

  function renderPresenceOverlay() {
    overlay.innerHTML = '';

    peers.forEach((peer) => {
      if (!peer.active || !peer.cursor) return;

      const caret = document.createElement('div');
      caret.className = `aurora-remote-caret aurora-peer-${peer.id}`;
      caret.style.cssText = `
        position: absolute;
        width: 2px;
        height: 20px;
        background: ${peer.color};
        box-shadow: 0 0 8px ${peer.color};
        transition: transform 0.12s ease-out;
        z-index: 51;
      `;

      // Peer Name Badge
      const badge = document.createElement('div');
      badge.className = 'aurora-remote-caret-badge';
      badge.textContent = peer.name;
      badge.style.cssText = `
        position: absolute;
        top: -22px;
        left: 0;
        background: ${peer.color};
        color: #040d21;
        font-size: 10px;
        font-weight: 700;
        padding: 2px 6px;
        border-radius: 4px;
        white-space: nowrap;
        pointer-events: none;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      `;
      caret.appendChild(badge);
      overlay.appendChild(caret);
    });
  }

  return {
    updatePeer: (peer: RemotePeer) => {
      peers.set(peer.id, peer);
      renderPresenceOverlay();
    },
    removePeer: (peerId: string) => {
      peers.delete(peerId);
      renderPresenceOverlay();
    },
    getPeers: () => Array.from(peers.values()),
    renderPresenceOverlay,
    destroy: () => {
      overlay.remove();
      peers.clear();
    }
  };
}
