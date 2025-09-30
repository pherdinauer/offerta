/**
 * È un'offerta? - Main App Component
 */
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'react-native';
import Toast from 'react-native-toast-message';

// Screens
import HomeScreen from './src/screens/HomeScreen';
import CameraScreen from './src/screens/CameraScreen';
import ResultScreen from './src/screens/ResultScreen';
import HistoryScreen from './src/screens/HistoryScreen';

// Types
export type RootStackParamList = {
  Home: undefined;
  Camera: undefined;
  Result: {
    receiptId: number;
    status: string;
  };
  History: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

const App: React.FC = () => {
  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerStyle: {
              backgroundColor: '#ffffff',
            },
            headerTintColor: '#333333',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        >
          <Stack.Screen 
            name="Home" 
            component={HomeScreen}
            options={{ title: "È un'offerta?" }}
          />
          <Stack.Screen 
            name="Camera" 
            component={CameraScreen}
            options={{ title: "Scatta foto" }}
          />
          <Stack.Screen 
            name="Result" 
            component={ResultScreen}
            options={{ title: "Risultato" }}
          />
          <Stack.Screen 
            name="History" 
            component={HistoryScreen}
            options={{ title: "Storico" }}
          />
        </Stack.Navigator>
      </NavigationContainer>
      <Toast />
    </>
  );
};

export default App;
