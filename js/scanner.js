/**
 * MedienTracker - Barcode Scanner (scanner.js)
 * Wrapper um html5-qrcode (CDN)
 */
const Scanner = (() => {
  'use strict';
  let _instance  = null;
  let _scanning  = false;
  let _containerId = null;

  async function start(containerId, onDetect, onError) {
    if (typeof Html5Qrcode === 'undefined') {
      throw new Error('html5-qrcode nicht geladen. Bitte Internetverbindung pruefen.');
    }
    if (_scanning) await stop();

    _containerId = containerId;
    _instance    = new Html5Qrcode(containerId);
    _scanning    = false;

    const config = {
      fps:          10,
      qrbox:        { width: 280, height: 140 },
      aspectRatio:  1.7,
      formatsToSupport: [
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.CODE_39,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E
      ]
    };

    try {
      await _instance.start(
        { facingMode: 'environment' },
        config,
        (decoded, result) => {
          const fmt = result?.result?.format?.formatName || 'UNKNOWN';
          onDetect(decoded, fmt);
        },
        (errMsg) => { /* Scan-Fehler normal wenn kein Code sichtbar */ }
      );
      _scanning = true;
    } catch (err) {
      _instance = null;
      throw err;
    }
  }

  async function stop() {
    if (_instance && _scanning) {
      try {
        await _instance.stop();
        _instance.clear();
      } catch (e) { /* ignorieren */ }
    }
    _instance = null;
    _scanning = false;
  }

  async function isAvailable() {
    if (typeof Html5Qrcode === 'undefined') return false;
    try {
      const cameras = await Html5Qrcode.getCameras();
      return cameras && cameras.length > 0;
    } catch { return false; }
  }

  return {
    start,
    stop,
    isAvailable,
    get active() { return _scanning; }
  };
})();