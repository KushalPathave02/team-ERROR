import './polyfills/url-polyfill';
import { registerRootComponent } from 'expo';
import { AppRegistry } from 'react-native';
import App from './App.tsx';

// Register for React Native
AppRegistry.registerComponent('main', () => App);

// Register for Expo
registerRootComponent(App);
