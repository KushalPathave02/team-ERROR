import { DefaultTheme } from 'react-native-paper';

export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#6200ee',
    accent: '#6200ee',
    background: '#ffffff',
    surface: '#ffffff',
    text: '#000000',
    error: '#d32f2f',
    disabled: '#9e9e9e',
    placeholder: '#757575',
    backdrop: 'rgba(0, 0, 0, 0.5)',
    notification: '#6200ee',
    border: '#e0e0e0',
  },
  roundness: 4,
  inputVariant: 'outlined' as const,
};

export const styles = {
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 28,
    marginBottom: 24,
    textAlign: 'center' as const,
    color: '#000000',
    fontWeight: 'normal' as const,
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#ffffff',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  button: {
    marginTop: 24,
    paddingVertical: 12,
    borderRadius: 4,
    elevation: 2,
    backgroundColor: '#6200ee',
  },
  error: {
    color: theme.colors.error,
    marginBottom: 16,
    textAlign: 'center' as const,
  },
  linkContainer: {
    marginTop: 24,
    alignItems: 'center' as const,
  },
  link: {
    color: '#6200ee',
    fontSize: 16,
  },
};
