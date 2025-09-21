import * as MdIcons from 'react-icons/md';
import React from 'react';

interface MaterialIconsProps {
    name: string;
    size?: number;
    color?: string;
    [key: string]: any;
}

/**
 * MaterialIcons component for web using react-icons.
 * Usage: <MaterialIcons name="MdHome" size={24} color="black" />
 */
export function MaterialIcons({ name, size, color, ...props }: MaterialIconsProps) {
    const IconComponent = (MdIcons as any)[name];
    if (!IconComponent) {
        // Optionally, render a default icon or null if the name is invalid
        return null;
    }
    return <IconComponent size={size} color={color} {...props} />;
}