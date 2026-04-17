import { useState } from 'react';
import { Platform } from 'react-native';
import NfcManager, { NfcTech, Ndef } from 'react-native-nfc-manager';

/**
 * Hook for writing a barcode string as an NDEF Text Record to an NFC chip.
 * Used by the NFC Chip Programmer admin screen.
 *
 * Usage:
 *   const { writeBarcode, cancel, writing } = useNfcWrite();
 *   await writeBarcode('ITEM-BARCODE-123');
 */
export function useNfcWrite() {
  const [writing, setWriting] = useState(false);

  async function writeBarcode(barcode: string): Promise<void> {
    setWriting(true);
    try {
      await NfcManager.requestTechnology(NfcTech.Ndef);

      const bytes = Ndef.encodeMessage([Ndef.textRecord(barcode)]);
      if (!bytes) throw new Error('Failed to encode NDEF message.');

      await NfcManager.ndefHandler.writeNdefMessage(bytes);

      if (Platform.OS === 'ios') {
        await NfcManager.setAlertMessageIOS('Chip programmed successfully!');
      }
    } finally {
      setWriting(false);
      await NfcManager.cancelTechnologyRequest().catch(() => {});
    }
  }

  async function cancel() {
    await NfcManager.cancelTechnologyRequest().catch(() => {});
    setWriting(false);
  }

  return { writeBarcode, cancel, writing };
}
