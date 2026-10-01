import { useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from "expo-camera";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { Body, Button, Card, Muted } from "@/components/ui";
import { itemForCode } from "@/lib/barcodes";
import { colors, space } from "@/lib/theme";

/** Camera barcode scanner; a known shelf code opens that item in Inventory. */
export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [unknown, setUnknown] = useState<string | null>(null);
  const handled = useRef(false);

  const onScan = (result: BarcodeScanningResult) => {
    if (handled.current) return;
    const name = itemForCode(result.data);
    if (!name) {
      setUnknown(result.data);
      return;
    }
    handled.current = true;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.dismissTo({ pathname: "/inventory", params: { focus: name } });
  };

  if (!permission) return <View style={styles.screen} />;

  if (!permission.granted) {
    return (
      <View style={[styles.screen, { padding: space.xl, justifyContent: "center" }]}>
        <Card style={{ gap: space.md }}>
          <Body style={{ fontWeight: "600" }}>Camera access needed</Body>
          <Muted>Polaris Twin uses the camera only to read shelf barcodes in the stores.</Muted>
          <Button label="Allow camera" onPress={() => void requestPermission()} />
        </Card>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ["qr", "code128", "ean13"] }}
        onBarcodeScanned={onScan}
      />
      <View style={styles.frame} pointerEvents="none" />
      <View style={styles.footer}>
        <Card style={{ gap: 4 }}>
          <Body style={{ fontWeight: "600" }}>Point at a shelf label</Body>
          <Muted>{unknown ? `“${unknown}” is not a Polaris Twin shelf code. Try another label.` : "Demo labels: polaris-twin-psi.vercel.app/barcodes"}</Muted>
        </Card>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#000" },
  frame: { position: "absolute", top: "25%", left: "15%", right: "15%", aspectRatio: 1, borderWidth: 3, borderColor: colors.brand, borderRadius: 16 },
  footer: { position: "absolute", left: space.lg, right: space.lg, bottom: space.xl },
});
