import * as MdIcons from 'react-icons/md';
import React from 'react';
import { View } from 'react-native';

interface MaterialIconsProps {
    name: string;
    size?: number;
    color?: string;
    style?: any;
    [key: string]: any;
}

// Icon name mapping from react-native-vector-icons to react-icons/md
const iconNameMap: Record<string, string> = {
    'share': 'MdShare',
    'home': 'MdHome',
    'settings': 'MdSettings',
    'menu': 'MdMenu',
    'close': 'MdClose',
    'add': 'MdAdd',
    'remove': 'MdRemove',
    'play-arrow': 'MdPlayArrow',
    'pause': 'MdPause',
    'stop': 'MdStop',
    // Add more mappings as needed
};

/**
 * MaterialIcons component for web using react-icons.
 * Usage: <MaterialIcons name="share" size={24} color="black" />
 * Automatically maps react-native-vector-icons names to react-icons/md names
 * Wrapped in View for react-native-web compatibility
 */
export function MaterialIcons({ name, size = 24, color = '#000', style, ...props }: MaterialIconsProps) {
    // Try direct name first (for MdXxx format), then try mapped name
    const iconName = iconNameMap[name] || name;
    let IconComponent = (MdIcons as any)[iconName];

    if (!IconComponent) {
        // Fallback: try with Md prefix
        const fallbackName = `Md${name.charAt(0).toUpperCase()}${name.slice(1)}`;
        IconComponent = (MdIcons as any)[fallbackName];

        if (!IconComponent) {
            // If still no icon found, return a default share icon for share, otherwise null
            if (name === 'share') {
                IconComponent = (MdIcons as any)['MdShare'];
            }
            if (!IconComponent) {
                return null;
            }
        }
    }

    // Wrap the react-icon in a View for react-native-web compatibility
    return (
        <View style={[{ width: size, height: size }, style]} {...props}>
            <IconComponent
                size={size}
                color={color}
                style={{
                    width: size,
                    height: size,
                    display: 'block' as any
                }}
            />
        </View>
    );
}