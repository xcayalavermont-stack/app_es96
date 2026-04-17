import { useEffect, useRef } from 'react';
import NfcManager, { NfcEvents, TagEvent } from 'react-native-nfc-manager';

/**
 * Continuously listens for NFC chips that were programmed with a barcode
 * (NDEF Text Record) and calls onBarcode with the decoded string.
 *
 * Uses the same event-based API as useNfcScan so it works on both platforms
 * without showing an iOS system sheet. Safe to mount on the Cart screen —
 * it registers/unregisters on mount/unmount.
 *
 * @param onBarcode  Called with the decoded barcode string when a chip is tapped.
 * @param enabled    Pass false to pause listening (e.g. while a modal is open).
 */
export function useNfcNdefRead(
  onBarcode: (barcode: string) => void,
  enabled: boolean,
) {
  // Keep a stable ref so the listener closure always calls the latest callback
  const onBarcodeRef = useRef(onBarcode);
  onBarcodeRef.current = onBarcode;

  useEffect(() => {
    if (!enabled) return;

    let active = true;

    async function start() {
      const supported = await NfcManager.isSupported();
      if (!supported || !active) return;

      // NfcManager.start() is idempotent — safe to call even if already started
      await NfcManager.start().catch(() => {});

      function handleTag(tag: TagEvent) {
        if (!active) return;

        try {
          const ndefMessage = (tag as any).ndefMessage;
          if (!Array.isArray(ndefMessage) || ndefMessage.length === 0) return;

          const record = ndefMessage[0];
          if (!record?.payload) return;

          // Payload layout for a Text record (RFC 3984):
          //   Byte 0 — status byte: bit7 = encoding (0=UTF-8), bits 5-0 = language-code length
          //   Bytes 1..langLen — ISO language code (e.g. "en")
          //   Remaining bytes — the text (UTF-8)
          const payload: number[] = Array.isArray(record.payload)
            ? record.payload
            : Array.from(record.payload as Uint8Array);

          if (payload.length < 2) return;

          const langLength = payload[0] & 0x3f;
          const textBytes = payload.slice(1 + langLength);
          const barcode = String.fromCharCode(...textBytes).trim();

          if (barcode) onBarcodeRef.current(barcode);
        } catch {
          // Malformed tag — silently ignore
        }

        // Re-register so the next chip tap is also caught
        NfcManager.unregisterTagEvent()
          .catch(() => {})
          .finally(() => {
            if (active) {
              NfcManager.registerTagEvent().catch(() => {});
            }
          });
      }

      NfcManager.setEventListener(NfcEvents.DiscoverTag, handleTag);
      await NfcManager.registerTagEvent().catch(() => {});
    }

    start();

    return () => {
      active = false;
      NfcManager.setEventListener(NfcEvents.DiscoverTag, null);
      NfcManager.unregisterTagEvent().catch(() => {});
    };
  }, [enabled]);
}
