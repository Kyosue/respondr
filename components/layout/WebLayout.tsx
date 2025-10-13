import { ResponsiveContainer } from '@/components/ui/ResponsiveContainer';
import { usePlatform } from '@/hooks/usePlatform';
import React from 'react';
import { StyleSheet, View } from 'react-native';

interface WebLayoutProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  sidebar?: React.ReactNode;
  footer?: React.ReactNode;
}

export function WebLayout({ children, header, sidebar, footer }: WebLayoutProps) {
  const { isWeb } = usePlatform();

  if (!isWeb) {
    return <>{children}</>;
  }

  return (
    <View style={styles.container}>
      {header && <View style={styles.header}>{header}</View>}
      
      <View style={styles.main}>
        {sidebar && <View style={styles.sidebar}>{sidebar}</View>}
        
        <ResponsiveContainer style={styles.content}>
          {children}
        </ResponsiveContainer>
      </View>
      
      {footer && <View style={styles.footer}>{footer}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  main: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 250,
    backgroundColor: '#fff',
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
    padding: 16,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  footer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});
