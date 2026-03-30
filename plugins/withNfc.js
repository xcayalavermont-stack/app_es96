const { withAndroidManifest, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

// Lists every NFC tech your MIFARE Classic 4k card can present as.
// Android will route any of these tag types directly to your app.
const NFC_TECH_FILTER_XML = `<?xml version="1.0" encoding="utf-8"?>
<resources xmlns:xliff="urn:ibm:names:tc:xliff:document:1.2">
    <tech-list>
        <tech>android.nfc.tech.NfcA</tech>
    </tech-list>
    <tech-list>
        <tech>android.nfc.tech.MifareClassic</tech>
    </tech-list>
</resources>
`;

function withNfcAndroid(config) {
  // 1. Add TECH_DISCOVERED intent-filter + meta-data to MainActivity
  config = withAndroidManifest(config, (cfg) => {
    const app = cfg.modResults.manifest.application[0];
    const mainActivity = app.activity.find(
      (a) => a.$['android:name'] === '.MainActivity'
    );

    if (!mainActivity) return cfg;

    mainActivity['intent-filter'] = mainActivity['intent-filter'] || [];

    const alreadyAdded = mainActivity['intent-filter'].some((f) =>
      f.action?.some(
        (a) => a.$['android:name'] === 'android.nfc.action.TECH_DISCOVERED'
      )
    );

    if (!alreadyAdded) {
      mainActivity['intent-filter'].push({
        action: [{ $: { 'android:name': 'android.nfc.action.TECH_DISCOVERED' } }],
      });

      mainActivity['meta-data'] = mainActivity['meta-data'] || [];
      mainActivity['meta-data'].push({
        $: {
          'android:name': 'android.nfc.action.TECH_DISCOVERED',
          'android:resource': '@xml/nfc_tech_filter',
        },
      });
    }

    return cfg;
  });

  // 2. Write the res/xml/nfc_tech_filter.xml resource file
  config = withDangerousMod(config, [
    'android',
    async (cfg) => {
      const xmlDir = path.join(
        cfg.modRequest.platformProjectRoot,
        'app', 'src', 'main', 'res', 'xml'
      );
      fs.mkdirSync(xmlDir, { recursive: true });
      fs.writeFileSync(path.join(xmlDir, 'nfc_tech_filter.xml'), NFC_TECH_FILTER_XML);
      return cfg;
    },
  ]);

  return config;
}

module.exports = withNfcAndroid;
