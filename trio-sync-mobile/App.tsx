import React, { useState, useEffect } from 'react';
import { Image, View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from './screens/LoginScreen';
import DashboardScreen from './screens/DashboardScreen';
import ClientesScreen from './screens/ClientesScreen';
import ProdutosScreen from './screens/ProdutosScreen';
import AtendimentosScreen from './screens/AtendimentosScreen';
import FinanceiroScreen from './screens/FinanceiroScreen';
import AgendaScreen from './screens/AgendaScreen';
import RelatoriosScreen from './screens/RelatoriosScreen';
import SimuladorScreen from './screens/SimuladorScreen';
import BannersScreen from './screens/BannersScreen';
import ContasPagarScreen from './screens/ContasPagarScreen';
import ContasReceberScreen from './screens/ContasReceberScreen';
import { Colors } from './constants/Colors';
import { checkSession, signOut } from './lib/supabase';

const Stack = createStackNavigator();

function LogoTitle() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Image
        style={{ width: 30, height: 30, marginRight: 10, borderRadius: 5 }}
        source={require('./assets/logo.jpg')}
      />
      <Text style={{ color: Colors.textInverted, fontWeight: 'bold', fontSize: 18 }}>
        AFG Soluções Financeiras
      </Text>
    </View>
  );
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Verificar sessão existente ao iniciar
  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        const session = await checkSession();
        if (session) {
          setIsLoggedIn(true);
        }
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkExistingSession();
  }, []);

  const handleLogout = async () => {
    await signOut();
    setIsLoggedIn(false);
  };

  // Tela de loading enquanto verifica sessão
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Image
          style={styles.loadingLogo}
          source={require('./assets/logo.jpg')}
          resizeMode="contain"
        />
        <ActivityIndicator size="large" color={Colors.primary} style={styles.loadingIndicator} />
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: Colors.primary },
          headerTintColor: Colors.textInverted,
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      >
        {!isLoggedIn ? (
          <Stack.Screen name="Login" options={{ headerShown: false }}>
            {(props) => <LoginScreen {...props} onLogin={() => setIsLoggedIn(true)} />}
          </Stack.Screen>
        ) : (
          <>
            <Stack.Screen
              name="Dashboard"
              component={DashboardScreen}
              options={{
                headerTitle: () => <LogoTitle />,
                headerRight: () => (
                  <TouchableOpacity
                    onPress={handleLogout}
                    style={{ marginRight: 15 }}
                  >
                    <Text style={{ color: Colors.textInverted, fontWeight: 'bold', fontSize: 16 }}>Sair</Text>
                  </TouchableOpacity>
                ),
              }}
            />
            <Stack.Screen
              name="Clientes"
              component={ClientesScreen}
              options={{ title: '👥 Clientes' }}
            />
            <Stack.Screen
              name="Produtos"
              component={ProdutosScreen}
              options={{ title: '📦 Produtos' }}
            />
            <Stack.Screen
              name="Atendimentos"
              component={AtendimentosScreen}
              options={{ title: '📞 Atendimentos' }}
            />
            <Stack.Screen
              name="Financeiro"
              component={FinanceiroScreen}
              options={{ title: '💰 Financeiro' }}
            />
            <Stack.Screen
              name="Agenda"
              component={AgendaScreen}
              options={{ title: '📅 Agenda' }}
            />
            <Stack.Screen
              name="Relatorios"
              component={RelatoriosScreen}
              options={{ title: '📈 Relatórios' }}
            />
            <Stack.Screen
              name="Simulador"
              component={SimuladorScreen}
              options={{ title: 'Simulador de Consórcio' }}
            />
            <Stack.Screen
              name="Banners"
              component={BannersScreen}
              options={{ title: 'Criador de Banners' }}
            />
            <Stack.Screen
              name="ContasPagar"
              component={ContasPagarScreen}
              options={{ title: '📤 Contas a Pagar' }}
            />
            <Stack.Screen
              name="ContasReceber"
              component={ContasReceberScreen}
              options={{ title: '📥 Contas a Receber' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingLogo: {
    width: 120,
    height: 120,
    borderRadius: 10,
    marginBottom: 20,
  },
  loadingIndicator: {
    marginTop: 10,
  },
  loadingText: {
    marginTop: 15,
    color: Colors.textSecondary,
    fontSize: 16,
  },
});
