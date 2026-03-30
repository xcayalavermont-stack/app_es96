import { useState, useEffect } from 'react';
import NfcManager, { NfcEvents, TagEvent } from 'react-native-nfc-manager';

export function useNfcScan() {
  const [scanning, setScanning] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    NfcManager.isSupported().then((s) => {
      setSupported(s);
      if (s) NfcManager.start();
    });
    return () => {
      NfcManager.unregisterTagEvent().catch(() => {});
    };
  }, []);

  async function scan(): Promise<string | null> {
    if (!supported) return null;
    setScanning(true);
    return new Promise((resolve) => {
      NfcManager.setEventListener(NfcEvents.DiscoverTag, (tag: TagEvent) => {
        NfcManager.setEventListener(NfcEvents.DiscoverTag, null);
        NfcManager.unregisterTagEvent().catch(() => {});
        setScanning(false);
        if (!tag?.id) { resolve(null); return; }
        const bytes = Array.isArray(tag.id) ? tag.id : Array.from(tag.id as unknown as Uint8Array);
        const uid = bytes
          .map((b: number) => b.toString(16).padStart(2, '0').toUpperCase())
          .join(':');
        resolve(uid);
      });
      NfcManager.registerTagEvent().catch(() => {
        NfcManager.setEventListener(NfcEvents.DiscoverTag, null);
        setScanning(false);
        resolve(null);
      });
    });
  }

  async function cancel() {
    NfcManager.setEventListener(NfcEvents.DiscoverTag, null);
    await NfcManager.unregisterTagEvent().catch(() => {});
    setScanning(false);
  }

  return { scan, cancel, scanning, supported };
}
