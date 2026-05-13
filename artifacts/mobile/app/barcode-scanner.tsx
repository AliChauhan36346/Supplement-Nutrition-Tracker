import { Feather } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

interface ProductResult {
  barcode: string;
  name: string;
  brand: string;
  servingSize: string;
  found: boolean;
}

async function lookupBarcode(barcode: string): Promise<ProductResult> {
  try {
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`,
      { headers: { "User-Agent": "SupplementTrackerPro/1.0" } }
    );
    const data = await response.json();
    if (data.status === 1 && data.product) {
      const p = data.product;
      return {
        barcode,
        name: p.product_name ?? p.product_name_en ?? "",
        brand: p.brands ?? "",
        servingSize: p.serving_size ?? "",
        found: true,
      };
    }
    return { barcode, name: "", brand: "", servingSize: "", found: false };
  } catch {
    return { barcode, name: "", brand: "", servingSize: "", found: false };
  }
}

export default function BarcodeScannerScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ProductResult | null>(null);
  const lastScanned = useRef<string | null>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleBarcode = useCallback(
    async (scanResult: { data: string }) => {
      if (!scanning || loading) return;
      if (lastScanned.current === scanResult.data) return;
      lastScanned.current = scanResult.data;
      setScanning(false);
      setLoading(true);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      const product = await lookupBarcode(scanResult.data);
      setResult(product);
      setLoading(false);
    },
    [scanning, loading]
  );

  const handleUse = () => {
    if (!result) return;
    const { setScanResult } = require("@/utils/scanStore");
    setScanResult({ name: result.name, brand: result.brand, barcode: result.barcode });
    router.back();
  };

  const handleRetry = () => {
    lastScanned.current = null;
    setResult(null);
    setScanning(true);
    setLoading(false);
  };

  if (!permission) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View
        style={[
          styles.center,
          styles.permissionScreen,
          { backgroundColor: colors.background, paddingTop: topPad + 20 },
        ]}
      >
        <View
          style={[
            styles.permIcon,
            { backgroundColor: colors.primary + "20", borderRadius: 40 },
          ]}
        >
          <Feather name="camera" size={40} color={colors.primary} />
        </View>
        <Text style={[styles.permTitle, { color: colors.foreground }]}>
          Camera Access Needed
        </Text>
        <Text style={[styles.permSub, { color: colors.mutedForeground }]}>
          Allow camera access to scan supplement barcodes and auto-fill product details.
        </Text>
        <TouchableOpacity
          onPress={requestPermission}
          style={[
            styles.permBtn,
            { backgroundColor: colors.primary, borderRadius: colors.radius },
          ]}
          activeOpacity={0.85}
        >
          <Text style={[styles.permBtnText, { color: colors.primaryForeground }]}>
            Allow Camera
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()} style={styles.cancelLink}>
          <Text style={[styles.cancelLinkText, { color: colors.mutedForeground }]}>
            Cancel
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: "#000" }]}>
      {Platform.OS !== "web" ? (
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{
            barcodeTypes: [
              "ean13",
              "ean8",
              "upc_a",
              "upc_e",
              "code128",
              "code39",
              "qr",
            ],
          }}
          onBarcodeScanned={scanning ? handleBarcode : undefined}
        />
      ) : (
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: "#111", alignItems: "center", justifyContent: "center" },
          ]}
        >
          <Feather name="camera-off" size={48} color="#666" />
          <Text style={{ color: "#666", marginTop: 16, fontFamily: "Inter_400Regular" }}>
            Camera scanning is not available on web.
          </Text>
          <Text style={{ color: "#666", marginTop: 8, fontFamily: "Inter_400Regular", fontSize: 12 }}>
            Use the Expo Go app on your phone to scan barcodes.
          </Text>
        </View>
      )}

      <View style={[styles.overlay, StyleSheet.absoluteFill]}>
        <View
          style={[
            styles.topBar,
            { paddingTop: topPad + 10, backgroundColor: "rgba(0,0,0,0.6)" },
          ]}
        >
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
            <Feather name="x" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.topTitle}>Scan Barcode</Text>
          <View style={{ width: 44 }} />
        </View>

        <View style={styles.scanArea}>
          <View style={styles.darkLeft} />
          <View style={styles.centerCol}>
            <View style={styles.darkTop} />
            <View style={styles.scanFrame}>
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />
              {loading && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator color="#FFF" size="large" />
                  <Text style={styles.loadingText}>Looking up product...</Text>
                </View>
              )}
            </View>
            <View style={styles.darkBottom} />
          </View>
          <View style={styles.darkRight} />
        </View>

        <View
          style={[
            styles.bottomArea,
            { backgroundColor: "rgba(0,0,0,0.6)", paddingBottom: botPad + 24 },
          ]}
        >
          {!result && !loading && (
            <Text style={styles.instructionText}>
              Point the camera at a supplement barcode
            </Text>
          )}
        </View>
      </View>

      {result && !loading && (
        <View
          style={[
            styles.resultCard,
            {
              backgroundColor: colors.card,
              borderRadius: colors.radius,
              paddingBottom: botPad + 16,
            },
          ]}
        >
          <View style={styles.resultHandle} />
          <View style={styles.resultHeader}>
            <View
              style={[
                styles.resultIcon,
                {
                  backgroundColor: result.found
                    ? colors.primary + "20"
                    : colors.error + "20",
                  borderRadius: 16,
                },
              ]}
            >
              <Feather
                name={result.found ? "check-circle" : "alert-circle"}
                size={22}
                color={result.found ? colors.primary : colors.error}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.resultTitle, { color: colors.foreground }]}>
                {result.found ? "Product Found" : "Product Not Found"}
              </Text>
              <Text
                style={[styles.resultBarcode, { color: colors.mutedForeground }]}
              >
                {result.barcode}
              </Text>
            </View>
          </View>

          {result.found ? (
            <View style={styles.resultDetails}>
              {result.name ? (
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>
                    Name
                  </Text>
                  <Text
                    style={[styles.detailValue, { color: colors.foreground }]}
                    numberOfLines={2}
                  >
                    {result.name}
                  </Text>
                </View>
              ) : null}
              {result.brand ? (
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>
                    Brand
                  </Text>
                  <Text
                    style={[styles.detailValue, { color: colors.foreground }]}
                    numberOfLines={1}
                  >
                    {result.brand}
                  </Text>
                </View>
              ) : null}
              {result.servingSize ? (
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>
                    Serving
                  </Text>
                  <Text
                    style={[styles.detailValue, { color: colors.foreground }]}
                    numberOfLines={1}
                  >
                    {result.servingSize}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : (
            <Text
              style={[styles.notFoundText, { color: colors.mutedForeground }]}
            >
              This barcode wasn't found in the database. You can still enter the
              details manually or try scanning again.
            </Text>
          )}

          <View style={styles.resultActions}>
            <TouchableOpacity
              onPress={handleRetry}
              style={[
                styles.retryBtn,
                {
                  borderColor: colors.border,
                  borderRadius: colors.radius,
                },
              ]}
              activeOpacity={0.8}
            >
              <Feather name="refresh-ccw" size={16} color={colors.foreground} />
              <Text style={[styles.retryText, { color: colors.foreground }]}>
                Scan Again
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleUse}
              style={[
                styles.useBtn,
                {
                  backgroundColor: colors.primary,
                  borderRadius: colors.radius,
                },
              ]}
              activeOpacity={0.85}
            >
              <Text style={[styles.useBtnText, { color: colors.primaryForeground }]}>
                {result.found ? "Use This Product" : "Enter Manually"}
              </Text>
              <Feather name="arrow-right" size={16} color={colors.primaryForeground} />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const FRAME = 240;
const CORNER = 24;
const BORDER = 3;

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  permissionScreen: { paddingHorizontal: 32, gap: 16, alignItems: "center" },
  permIcon: {
    width: 80,
    height: 80,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  permTitle: {
    fontSize: 22,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  permSub: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
  },
  permBtn: {
    width: "100%",
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  permBtnText: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  cancelLink: { paddingVertical: 8 },
  cancelLinkText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  overlay: { flexDirection: "column" },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  closeBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  topTitle: {
    flex: 1,
    color: "#FFF",
    fontSize: 17,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
  scanArea: {
    flex: 1,
    flexDirection: "row",
  },
  darkLeft: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  darkRight: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  centerCol: {
    width: FRAME,
    flexDirection: "column",
  },
  darkTop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  darkBottom: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  scanFrame: {
    width: FRAME,
    height: FRAME,
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: CORNER,
    height: CORNER,
    borderColor: "#10B981",
    borderWidth: BORDER,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 6,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 6,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 6,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 6,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    gap: 10,
    borderRadius: 6,
  },
  loadingText: {
    color: "#FFF",
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  bottomArea: {
    minHeight: 80,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingTop: 16,
  },
  instructionText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  resultCard: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingTop: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 16,
  },
  resultHandle: {
    width: 36,
    height: 4,
    backgroundColor: "rgba(0,0,0,0.15)",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  resultIcon: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  resultBarcode: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  resultDetails: {
    gap: 10,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    gap: 12,
  },
  detailLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    width: 60,
    flexShrink: 0,
  },
  detailValue: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  notFoundText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
    marginBottom: 16,
  },
  resultActions: {
    flexDirection: "row",
    gap: 10,
  },
  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
  },
  retryText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  useBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 12,
    flex: 1.5,
    justifyContent: "center",
  },
  useBtnText: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
});
