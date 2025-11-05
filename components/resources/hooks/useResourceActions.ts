import { useState } from 'react';
import { Alert } from 'react-native';

import { useResources } from '@/contexts/ResourceContext';
import { Resource } from '@/types/Resource';

interface UseResourceActionsProps {
  onEdit?: (resource: Resource) => void;
  onBorrow?: (resource: Resource) => void;
  onReturn?: (resource: Resource) => void;
  onDelete?: (resource: Resource) => void;
}

export function useResourceActions(props?: UseResourceActionsProps) {
  const { deleteResource } = useResources();
  const [openActionsMenuId, setOpenActionsMenuId] = useState<string | null>(null);
  const [selectedResourceForMenu, setSelectedResourceForMenu] = useState<Resource | null>(null);

  const handleEdit = (resource: Resource) => {
    if (props?.onEdit) {
      props.onEdit(resource);
    }
  };

  const handleBorrow = (resource: Resource) => {
    if (props?.onBorrow) {
      props.onBorrow(resource);
    }
  };

  const handleReturn = (resource: Resource) => {
    if (props?.onReturn) {
      props.onReturn(resource);
    }
  };

  const handleDelete = (resource: Resource) => {
    if (props?.onDelete) {
      props.onDelete(resource);
    } else {
      // Fallback to default Alert behavior if no custom handler provided
      Alert.alert(
        'Delete Resource',
        `Are you sure you want to delete "${resource.name}"? This action cannot be undone.`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                await deleteResource(resource.id);
              } catch (error) {
                console.error('Error deleting resource:', error);
                const errorMessage = error instanceof Error ? error.message : 'Failed to delete resource';
                Alert.alert('Error', `Failed to delete resource: ${errorMessage}`);
              }
            },
          },
        ]
      );
    }
  };

  const handleActionsMenuToggle = (resourceId: string) => {
    if (openActionsMenuId === resourceId) {
      setOpenActionsMenuId(null);
      setSelectedResourceForMenu(null);
    } else {
      setOpenActionsMenuId(resourceId);
      // This will be handled by the parent component to find the resource
    }
  };

  const handleActionsMenuClose = () => {
    setOpenActionsMenuId(null);
    setSelectedResourceForMenu(null);
  };

  return {
    openActionsMenuId,
    selectedResourceForMenu,
    setSelectedResourceForMenu,
    handleEdit,
    handleBorrow,
    handleReturn,
    handleDelete,
    handleActionsMenuToggle,
    handleActionsMenuClose,
  };
}
