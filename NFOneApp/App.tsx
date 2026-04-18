import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, TextInput, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';

// Importação dos Tipos
import { RootStackParamList, MainStackParamList } from './src/navigation/types';

// Importação das Telas
import Login from './src/screens/Login';
import Faturamento from './src/screens/Faturamento';
import CatalogoTecnico from './src/screens/CatalogoTecnico';
import AdminEquipamentos from './src/screens/AdminEquipamentos';
import Logistica from './src/screens/Logistica';
import Dashboard from './src/screens/Dashboard';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const ContentStack = createNativeStackNavigator<MainStackParamList>();

const theme = {
  bgSidebar: '#111522',
  headerBg: '#0A0E1A',
  bgGradientStart: '#0B132B',
  bgGradientEnd: '#1C3A63',
  bgCardBlue: '#151A30',
  inputBg: '#0F131F',
  textPrimary: '#FFFFFF',
  textSecondary: '#A0A4B8',
  border: '#2A2F45',
  mixStart: '#00C6FF',
  mixEnd: '#22C55E',
};

// --- COMPONENTE DA SIDEBAR ---
function Sidebar({ navigation, currentRoute, onLogout }: any) {
  const menuItems = [
    { name: 'Dashboard', icon: 'home', route: 'Dashboard' },
    { name: 'Notas Fiscais', icon: 'file-text', route: 'Faturamento' },
    { name: 'Clientes', icon: 'users', route: 'Catalogo' },
    { name: 'Agenda', icon: 'calendar', route: 'Logistica' },
  ];

  return (
    <View style={[styles.sidebar, { backgroundColor: theme.bgSidebar, borderRightColor: theme.mixEnd, borderRightWidth: 1 }]}>
      <View style={styles.logoContainer}>
        <Text style={styles.brand}>
          <Text style={{ color: theme.mixEnd }}>N F O N E</Text>
        </Text>
        <Text style={[styles.brandSub, { color: theme.textPrimary }]}>Sistema de Notas Fiscais</Text>
      </View>

      <View style={styles.menuGroup}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.route}
            style={styles.menuItem}
            onPress={() => navigation.navigate(item.route)}
          >
            <Feather
              name={item.icon as any}
              size={20}
              color={currentRoute === item.route ? theme.mixEnd : theme.textSecondary}
              style={{ marginRight: 15 }}
            />
            <Text style={[styles.menuText, {
              color: currentRoute === item.route ? theme.mixEnd : theme.textSecondary,
              fontWeight: currentRoute === item.route ? 'bold' : 'normal'
            }]}>{item.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View>
        <View style={[styles.profileSidebar, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
          <View style={styles.profileAvatar}><Feather name="user" size={18} color="#FFF" /></View>
          <View>
            <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 14 }}>Ágatha</Text>
            <Text style={{ color: theme.textSecondary, fontSize: 12 }}>Administradora</Text>
          </View>
        </View>

        <TouchableOpacity onPress={onLogout} style={[styles.logoutBtn, { borderColor: theme.border }]}>
          <Feather name="log-out" size={18} color={theme.textSecondary} style={{ marginRight: 10 }} />
          <Text style={{ color: theme.textSecondary, fontSize: 14 }}>Sair do Sistema</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// --- LAYOUT PRINCIPAL COM SIDEBAR + NAVEGADOR DE CONTEÚDO ---
function MainLayout({ navigation, onLogout }: any) {
  // Obtém o nome da rota atual para destacar o menu na Sidebar
  const state = navigation.getState();
  const currentRoute = state?.routes[state.index]?.state?.routes
    ? state.routes[state.index].state.routes[state.routes[state.index].state.index].name
    : 'Dashboard';

  return (
    <View style={styles.container}>
      <Sidebar navigation={navigation} currentRoute={currentRoute} onLogout={onLogout} />

      <View style={styles.mainContent}>
        {/* Header fixo para todas as telas internas */}
        <View style={[styles.topHeader, { backgroundColor: theme.headerBg, borderBottomColor: theme.mixStart, borderBottomWidth: 1 }]}>
          <View style={[styles.searchBar, { backgroundColor: theme.inputBg, borderColor: theme.border, borderWidth: 1 }]}>
            <Feather name="search" size={18} color={theme.mixStart} style={{ marginRight: 10 }} />
            <TextInput style={{ flex: 1, color: '#FFF' }} placeholder="Buscar..." placeholderTextColor={theme.textSecondary} />
          </View>

          <View style={styles.topProfile}>
            <Feather name="bell" size={20} color={theme.mixStart} style={{ marginRight: 20 }} />
            <Feather name="mail" size={20} color={theme.mixStart} style={{ marginRight: 25 }} />
            <View style={[styles.profileAvatarMini, { borderColor: theme.mixStart, borderWidth: 1 }]}><Feather name="user" size={16} color={theme.mixStart} /></View>
            <Text style={{ color: '#FFF', marginLeft: 10, fontWeight: 'bold' }}>Ágatha</Text>
          </View>
        </View>

        {/* O Stack Navigator que troca apenas o conteúdo da direita */}
        <ContentStack.Navigator screenOptions={{ headerShown: false }}>
          <ContentStack.Screen name="Dashboard" component={Dashboard} />
          <ContentStack.Screen name="Faturamento">
            {props => <Faturamento {...props} isDarkMode={true} />}
          </ContentStack.Screen>
          <ContentStack.Screen name="Catalogo">
            {props => <CatalogoTecnico {...props} isDarkMode={true} />}
          </ContentStack.Screen>
          <ContentStack.Screen name="Logistica">
            {props => <Logistica {...props} isDarkMode={true} />}
          </ContentStack.Screen>
          <ContentStack.Screen name="Admin">
            {props => <AdminEquipamentos {...props} isDarkMode={true} />}
          </ContentStack.Screen>
        </ContentStack.Navigator>
      </View>
    </View>
  );
}

export default function App() {
  const [isAutenticado, setIsAutenticado] = useState(false);
  const [carregandoAuth, setCarregandoAuth] = useState(true);

  useEffect(() => {
    verificarLoginSalvo();
  }, []);

  const verificarLoginSalvo = async () => {
    try {
      const authStatus = await AsyncStorage.getItem('@nfone_auth');
      if (authStatus === 'true') setIsAutenticado(true);
    } catch (error) { console.error(error); }
    finally { setCarregandoAuth(false); }
  };

  const fazerLogin = async () => {
    await AsyncStorage.setItem('@nfone_auth', 'true');
    setIsAutenticado(true);
  };

  const fazerLogout = async () => {
    await AsyncStorage.removeItem('@nfone_auth');
    setIsAutenticado(false);
  };

  if (carregandoAuth) return <View style={{ flex: 1, backgroundColor: theme.bgGradientStart }} />;

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {!isAutenticado ? (
          <RootStack.Screen name="Login">
            {props => <Login {...props} onLogin={fazerLogin} />}
          </RootStack.Screen>
        ) : (
          <RootStack.Screen name="Main">
            {props => <MainLayout {...props} onLogout={fazerLogout} />}
          </RootStack.Screen>
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row' },
  sidebar: { width: 250, padding: 25, justifyContent: 'space-between' },
  logoContainer: { marginBottom: 40, marginTop: 10 },
  brand: { fontSize: 26, fontWeight: '800', letterSpacing: 3 },
  brandSub: { fontSize: 11, marginTop: 5 },
  menuGroup: { flex: 1 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, marginBottom: 5 },
  menuText: { fontSize: 15 },
  profileSidebar: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 12, borderWidth: 1, marginBottom: 15 },
  profileAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0, 198, 255, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 12, borderWidth: 1, justifyContent: 'center' },
  mainContent: { flex: 1, flexDirection: 'column' },
  topHeader: { height: 80, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 40 },
  searchBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, height: 40, borderRadius: 20, flex: 1, maxWidth: 400 },
  topProfile: { flexDirection: 'row', alignItems: 'center', marginLeft: 'auto' },
  profileAvatarMini: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0, 198, 255, 0.1)', justifyContent: 'center', alignItems: 'center' },
});