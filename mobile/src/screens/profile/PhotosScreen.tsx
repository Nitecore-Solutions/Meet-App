import React, { useMemo, useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ImagePlus, Plus, Sparkles, Star, X } from "lucide-react-native";

import { ScreenHeader } from "../../components/ScreenHeader";
import { colors, radii, shadow, spacing } from "../../constants/theme";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { profilePhotos } from "../../data/images";
import { defaultMyProfile } from "../../data/profiles";
import type { AppStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<AppStackParamList, "Photos">;

const library = Object.entries(profilePhotos).map(([key, source]) => ({
  key,
  source,
}));

export function PhotosScreen({ navigation }: Props) {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
  const profile = user ?? defaultMyProfile;
  const [libraryOpen, setLibraryOpen] = useState(false);
  const photos = profile.photos;

  const slots = useMemo(() => Array.from({ length: 6 }), []);

  function setMain(index: number) {
    if (index === 0) return;
    const next = [...photos];
    const [picked] = next.splice(index, 1);
    next.unshift(picked);
    updateUser({ photos: next, photo: next[0] });
    showToast("Main profile photo updated.", "success");
  }

  function removePhoto(index: number) {
    if (photos.length <= 1) {
      showToast("You need at least one profile photo.", "error");
      return;
    }
    const next = photos.filter((_, itemIndex) => itemIndex !== index);
    updateUser({ photos: next, photo: next[0] });
    showToast("Photo removed.", "info");
  }

  function addPhoto(source: (typeof photos)[number]) {
    if (photos.length >= 6) {
      showToast("You can add up to 6 photos.", "info");
      return;
    }
    const next = [...photos, source];
    updateUser({ photos: next, photo: next[0] });
    setLibraryOpen(false);
    showToast("Photo added. Tap it to make it your main photo.", "success");
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScreenHeader
        title="Photos"
        subtitle={`${photos.length} of 6 photos`}
        onBack={() => navigation.goBack()}
        right={
          <View style={styles.countPill}>
            <ImagePlus size={15} color={colors.primary} strokeWidth={2.2} />
            <Text style={styles.countText}>{photos.length}/6</Text>
          </View>
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.grid}>
          {slots.map((_, index) => {
            const photo = photos[index];
            if (photo) {
              return (
                <View key={`photo-${index}`} style={styles.cell}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={
                      index === 0
                        ? "Main profile photo"
                        : "Make this the main photo"
                    }
                    onPress={() => setMain(index)}
                    style={({ pressed }) => [
                      styles.photoButton,
                      { opacity: pressed ? 0.85 : 1 },
                    ]}
                  >
                    <Image source={photo} style={styles.photo} />
                    {index === 0 ? (
                      <View style={styles.mainTag}>
                        <Star
                          size={10}
                          color={colors.warning}
                          fill={colors.warning}
                        />
                        <Text style={styles.mainTagText}>MAIN</Text>
                      </View>
                    ) : null}
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Remove photo"
                    onPress={() => removePhoto(index)}
                    hitSlop={8}
                    style={styles.removeButton}
                  >
                    <X size={13} color={colors.ink} strokeWidth={2.8} />
                  </Pressable>
                </View>
              );
            }
            return (
              <Pressable
                key={`empty-${index}`}
                accessibilityRole="button"
                accessibilityLabel="Add a photo"
                onPress={() => setLibraryOpen(true)}
                style={({ pressed }) => [
                  styles.cell,
                  styles.emptyCell,
                  { opacity: pressed ? 0.6 : 1 },
                ]}
              >
                <Plus size={30} color={colors.disabled} strokeWidth={1.6} />
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.hint}>
          Tap a photo to make it your main photo. Your main photo is the first
          thing people see.
        </Text>

        <View style={styles.tipsCard}>
          <View style={styles.tipsHeader}>
            <Sparkles size={18} color={colors.primary} strokeWidth={2.2} />
            <Text style={styles.tipsTitle}>Photo tips that work</Text>
          </View>
          <Tip text="Use a clear face photo as your main picture." />
          <Tip text="Mix close-ups with full-body and hobby shots." />
          <Tip text="Skip group photos where it's hard to spot you." />
          <Tip text="Natural light beats a heavy filter every time." />
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => setLibraryOpen(true)}
          style={({ pressed }) => [
            styles.addButton,
            { opacity: pressed ? 0.8 : 1 },
          ]}
        >
          <ImagePlus size={19} color={colors.white} strokeWidth={2.2} />
          <Text style={styles.addButtonText}>ADD MORE PHOTOS</Text>
        </Pressable>

        <Text style={styles.note}>
          Add clear photos from your gallery so people can recognise you. Your
          best photo appears first in discovery.
        </Text>
      </ScrollView>

      <Modal
        visible={libraryOpen}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setLibraryOpen(false)}
      >
        <View style={styles.modalRoot}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setLibraryOpen(false)}
          />
          <View
            style={[
              styles.sheet,
              { paddingBottom: Math.max(insets.bottom, spacing.lg) },
            ]}
          >
            <View style={styles.grabber} />
            <View style={styles.sheetHeader}>
              <View style={styles.sheetTitles}>
                <Text style={styles.sheetTitle}>Choose a photo</Text>
                <Text style={styles.sheetSub}>
                  Demo photo library — pick one to add to your profile.
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close photo library"
                onPress={() => setLibraryOpen(false)}
                style={styles.close}
              >
                <X size={18} color={colors.body} strokeWidth={2.3} />
              </Pressable>
            </View>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.libraryContent}
            >
              <View style={styles.libraryGrid}>
                {library.map((item) => (
                  <Pressable
                    key={item.key}
                    accessibilityRole="button"
                    accessibilityLabel={`Add photo ${item.key}`}
                    onPress={() => addPhoto(item.source)}
                    style={({ pressed }) => [
                      styles.libraryCell,
                      { opacity: pressed ? 0.7 : 1 },
                    ]}
                  >
                    <Image source={item.source} style={styles.libraryPhoto} />
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function Tip({ text }: { text: string }) {
  return (
    <View style={styles.tipRow}>
      <View style={styles.tipDot} />
      <Text style={styles.tipText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  countPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: colors.primarySoft,
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  countText: {
    fontSize: 10.5,
    fontWeight: "700",
    color: colors.primaryDark,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  cell: {
    width: "31.4%",
    aspectRatio: 0.79,
    borderRadius: radii.md,
    overflow: "hidden",
    backgroundColor: colors.lineSoft,
    position: "relative",
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  photoButton: {
    flex: 1,
  },
  emptyCell: {
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: colors.line,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  mainTag: {
    position: "absolute",
    left: 7,
    bottom: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(17,13,27,0.74)",
    borderRadius: radii.pill,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  mainTagText: {
    color: colors.white,
    fontSize: 7.5,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  removeButton: {
    position: "absolute",
    right: 7,
    top: 7,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.soft,
  },
  hint: {
    fontSize: 11,
    lineHeight: 16,
    color: colors.muted,
    textAlign: "center",
    marginTop: spacing.lg,
  },
  tipsCard: {
    backgroundColor: colors.primaryTint,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: "#FFE6DA",
    padding: spacing.lg,
    marginTop: spacing.xxl,
    gap: spacing.sm,
  },
  tipsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: 2,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.ink,
  },
  tipRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  tipDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginTop: 6,
  },
  tipText: {
    flex: 1,
    fontSize: 11.5,
    lineHeight: 17,
    color: colors.body,
    fontWeight: "500",
  },
  addButton: {
    marginTop: spacing.xxl,
    minHeight: 50,
    borderRadius: radii.md,
    backgroundColor: colors.secondary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  addButtonText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  note: {
    fontSize: 10.5,
    lineHeight: 15,
    color: colors.faint,
    textAlign: "center",
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: colors.overlay,
  },
  sheet: {
    maxHeight: "82%",
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingTop: spacing.sm,
    ...shadow.raised,
  },
  grabber: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.line,
    alignSelf: "center",
    marginBottom: spacing.md,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  sheetTitles: {
    flex: 1,
  },
  sheetTitle: {
    fontSize: 21,
    fontWeight: "700",
    color: colors.ink,
  },
  sheetSub: {
    fontSize: 11.5,
    lineHeight: 16,
    color: colors.muted,
    marginTop: 3,
  },
  close: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.lineSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  libraryContent: {
    paddingHorizontal: spacing.xl,
  },
  libraryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    paddingBottom: spacing.lg,
  },
  libraryCell: {
    width: "31.4%",
    aspectRatio: 1,
    borderRadius: radii.md,
    overflow: "hidden",
  },
  libraryPhoto: {
    width: "100%",
    height: "100%",
  },
});
