import { PropsWithChildren } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { Modal, Portal } from 'react-native-paper';

export type AppModalProps = PropsWithChildren<{
  visible: boolean;
  onDismiss: () => void;
  contentStyle?: StyleProp<ViewStyle>;
}>;

export function AppModal({ visible, onDismiss, contentStyle, children }: AppModalProps) {
  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} style={contentStyle}>
        {children}
      </Modal>
    </Portal>
  );
}
