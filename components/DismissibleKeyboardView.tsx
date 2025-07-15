import React from 'react';
import { TouchableWithoutFeedback, Keyboard, View } from 'react-native';

interface DismissibleKeyboardViewProps {
  children: React.ReactNode;
  className?: string;
}

export const DismissibleKeyboardView: React.FC<DismissibleKeyboardViewProps> = ({ 
  children, 
  className = "flex-1" 
}) => {
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View className={className}>
        {children}
      </View>
    </TouchableWithoutFeedback>
  );
};