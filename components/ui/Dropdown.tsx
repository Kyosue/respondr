import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

const DROPDOWN_Z_INDEX = 100000;
const BACKDROP_Z_INDEX = DROPDOWN_Z_INDEX - 1;

export type DropdownPlacement = 'bottom' | 'top';
export type DropdownAlign = 'start' | 'end' | 'center';

export interface DropdownAnchorLayout {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DropdownProps {
  /** Whether the dropdown is open */
  open: boolean;
  /** Called when open state should change (e.g. close on outside click) */
  onOpenChange: (open: boolean) => void;
  /** Trigger element (anchored for measurement; wrap in View if needed) */
  trigger: React.ReactNode;
  /** Dropdown content (list, menu, etc.) */
  children: React.ReactNode;
  /** Preferred placement relative to trigger */
  placement?: DropdownPlacement;
  /** Horizontal alignment when dropdown is wider than trigger */
  align?: DropdownAlign;
  /** Min width of dropdown (default: trigger width) */
  minWidth?: number;
  /** Max width of dropdown */
  maxWidth?: number;
  /** Max height of dropdown (will be constrained to viewport if smaller) */
  maxHeight?: number;
  /** Constrain dropdown to viewport (default: true) */
  constrainToViewport?: boolean;
  /** Close on Escape key (default: true) */
  closeOnEscape?: boolean;
  /** Close on backdrop press (default: true) */
  closeOnBackdropPress?: boolean;
  /** Render dropdown into document.body on web to avoid stacking/overflow issues (default: true on web) */
  renderInPortal?: boolean;
  /** Optional style for the dropdown container */
  dropdownStyle?: object;
}

export function Dropdown({
  open,
  onOpenChange,
  trigger,
  children,
  placement = 'bottom',
  align = 'start',
  minWidth,
  maxWidth,
  maxHeight = 320,
  constrainToViewport = true,
  closeOnEscape = true,
  closeOnBackdropPress = true,
  renderInPortal = Platform.OS === 'web',
  dropdownStyle,
}: DropdownProps) {
  const anchorRef = useRef<View>(null);
  const [anchorLayout, setAnchorLayout] = useState<DropdownAnchorLayout | null>(null);
  const isWeb = Platform.OS === 'web';

  const measureAnchor = useCallback(() => {
    if (!anchorRef.current || !open) return;
    anchorRef.current.measureInWindow((x, y, width, height) => {
      setAnchorLayout({ x, y, width, height });
    });
  }, [open]);

  // Measure trigger when opening; on web with portal we may need a frame for layout
  useEffect(() => {
    if (!open) {
      setAnchorLayout(null);
      return;
    }
    const id = requestAnimationFrame?.(() => {
      measureAnchor();
    }) ?? setTimeout(measureAnchor, 0);
    return () => (clearTimeout as any)?.(id);
  }, [open, measureAnchor]);

  // Escape key (web: document listener; native: Modal onRequestClose handles back button)
  useEffect(() => {
    if (!open || !closeOnEscape || !isWeb) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, closeOnEscape, onOpenChange, isWeb]);

  const handleBackdropPress = useCallback(() => {
    if (closeOnBackdropPress) onOpenChange(false);
  }, [closeOnBackdropPress, onOpenChange]);

  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const w = anchorLayout?.width ?? 0;
  const h = anchorLayout?.height ?? 0;
  const x = anchorLayout?.x ?? 0;
  const y = anchorLayout?.y ?? 0;

  let top = placement === 'bottom' ? y + h : y - maxHeight;
  let left = x;
  if (align === 'center') left = x + (w / 2) - (minWidth ?? w) / 2;
  else if (align === 'end') left = x + w - (minWidth ?? w);

  const dropdownWidth = minWidth ?? w;
  const effectiveMaxHeight = Math.min(maxHeight, constrainToViewport ? screenHeight - 24 : maxHeight);

  if (anchorLayout && constrainToViewport) {
    if (top < 8) top = 8;
    if (top + effectiveMaxHeight > screenHeight - 8) top = screenHeight - effectiveMaxHeight - 8;
    if (left < 8) left = 8;
    if (left + dropdownWidth > screenWidth - 8) left = screenWidth - dropdownWidth - 8;
  }

  const dropdownContent = anchorLayout && (
    <View
      style={[
        styles.dropdown,
        {
          top,
          left,
          width: dropdownWidth,
          maxWidth: maxWidth ?? screenWidth - 16,
          maxHeight: effectiveMaxHeight,
          zIndex: DROPDOWN_Z_INDEX,
          elevation: DROPDOWN_Z_INDEX,
        },
        dropdownStyle,
      ]}
      onStartShouldSetResponder={() => true}
    >
      {children}
    </View>
  );

  const backdrop = (
    <Pressable
      style={[StyleSheet.absoluteFill, styles.backdrop, { zIndex: BACKDROP_Z_INDEX, elevation: BACKDROP_Z_INDEX }]}
      onPress={handleBackdropPress}
      accessibilityRole="button"
      accessibilityLabel="Close dropdown"
    />
  );

  // On web: optionally render into document.body to avoid stacking/overflow clipping
  let overlayContent: React.ReactNode = null;
  if (open) {
    overlayContent = (
      <>
        {backdrop}
        {dropdownContent}
      </>
    );
  }

  if (isWeb && renderInPortal && open && typeof document !== 'undefined' && document.body) {
    try {
      const ReactDOM = require('react-dom');
      if (ReactDOM.createPortal) {
        return (
          <>
            <View style={styles.triggerWrap} collapsable={false} ref={anchorRef}>
              {trigger}
            </View>
            {ReactDOM.createPortal(overlayContent, document.body)}
          </>
        );
      }
    } catch {
      // react-dom not available (e.g. native)
    }
  }

  return (
    <>
      <View style={styles.triggerWrap} collapsable={false} ref={anchorRef}>
        {trigger}
      </View>
      <Modal visible={open} transparent animationType="fade" statusBarTranslucent onRequestClose={() => onOpenChange(false)}>
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          {backdrop}
          {dropdownContent}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  triggerWrap: {
    alignSelf: 'stretch',
  },
  backdrop: {
    backgroundColor: 'transparent',
  },
  dropdown: {
    position: 'absolute',
    ...(Platform.OS === 'web' && {
      position: 'fixed' as any,
      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
    }),
  },
});
