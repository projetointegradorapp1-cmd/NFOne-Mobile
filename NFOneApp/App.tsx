import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';

// Importação das Telas
import Login from './src/screens/Login';
import Faturamento from './src/screens/Faturamento';
import CatalogoTecnico from './src/screens/CatalogoTecnico';
import AdminEquipamentos from './src/screens/AdminEquipamentos';
import Logistica from './src/screens/Logistica';
import Dashboard from './src/screens/Dashboard';
import Clientes from './src/screens/Clientes';

const Stack = createNativeStackNavigator();

const theme = {
  bgSidebar: '#111522',
  headerBg: '#0A0E1A',
  bgGradientStart: '#0B132B',
  inputBg: '#0F131F',
  textPrimary: '#FFFFFF',
  textSecondary: '#A0A4B8',
  border: '#2A2F45',
  mixEnd: '#22C55E',
  mixStart: '#00C6FF',
};

// --- COMPONENTE DA SIDEBAR ---
function Sidebar({ onLogout }: { onLogout: () => void }) {
  const navigation = useNavigation<any>();

  const menuItems = [
    { name: 'Dashboard', icon: 'home', route: 'Dashboard' },
    { name: 'Notas Fiscais', icon: 'file-text', route: 'Faturamento' },
    { name: 'Catálogo Técnico', icon: 'book', route: 'Catalogo' },
    { name: 'Clientes', icon: 'users', route: 'Clientes' },
    { name: 'Ordem de Serviço', icon: 'calendar', route: 'Logistica' },
    { name: 'Admin', icon: 'settings', route: 'Admin' },
  ];

  return (
    <View style={[styles.sidebar, { backgroundColor: theme.bgSidebar, borderRightColor: theme.mixEnd, borderRightWidth: 1 }]}>
      <View style={styles.logoContainer}>
        <Text style={styles.brand}><Text style={{ color: theme.mixEnd }}>N F O N E</Text></Text>
        <Text style={styles.brandSub}>Gestão Operacional</Text>
      </View>

      <View style={{ flex: 1 }}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.route}
            style={styles.menuItem}
            onPress={() => navigation.navigate(item.route)}
          >
            <Feather name={item.icon as any} size={20} color={theme.textSecondary} style={{ marginRight: 15 }} />
            <Text style={[styles.menuText, { color: theme.textSecondary }]}>{item.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity onPress={onLogout} style={[styles.logoutBtn, { borderColor: theme.border }]}>
        <Feather name="log-out" size={18} color={theme.textSecondary} style={{ marginRight: 10 }} />
        <Text style={{ color: theme.textSecondary }}>Sair</Text>
      </TouchableOpacity>
    </View>
  );
}

// --- LAYOUT PRINCIPAL (SIDEBAR + CONTEÚDO) ---
function MainLayout({ onLogout }: { onLogout: () => void }) {
  return (
    <View style={styles.container}>
      <Sidebar onLogout={onLogout} />
      <View style={styles.mainContent}>
        {/* Header Fixo */}
        <View style={[styles.topHeader, { backgroundColor: theme.headerBg, borderBottomColor: theme.mixStart, borderBottomWidth: 1 }]}>
          <View style={[styles.searchBar, { backgroundColor: theme.inputBg, borderColor: theme.border, borderWidth: 1 }]}>
            <Feather name="search" size={18} color={theme.mixStart} style={{ marginRight: 10 }} />
            <TextInput style={{ flex: 1, color: '#FFF' }} placeholder="Buscar..." placeholderTextColor={theme.textSecondary} />
          </View>
          <View style={styles.topProfile}>
            <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Ágatha</Text>
          </View>
        </View>

        {/* Navegador das Telas da Direita */}
        <Stack.Navigator screenOptions={{ headerShown: false, animation: 'none' }}>
          <Stack.Screen name="Dashboard" component={Dashboard} />
          <Stack.Screen name="Faturamento">{p => <Faturamento {...p} isDarkMode={true} />}</Stack.Screen>
          <Stack.Screen name="Catalogo">{p => <CatalogoTecnico {...p} isDarkMode={true} />}</Stack.Screen>
          <Stack.Screen name="Clientes" component={Clientes} />
          <Stack.Screen name="Logistica">{p => <Logistica {...p} isDarkMode={true} />}</Stack.Screen>
          <Stack.Screen name="Admin">{p => <AdminEquipamentos {...p} isDarkMode={true} />}</Stack.Screen>
        </Stack.Navigator>
      </View>
    </View>
  );
}

// --- COMPONENTE RAIZ ---
export default function App() {
  const [isAutenticado, setIsAutenticado] = useState(false);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem('@nfone_auth').then(val => {
      if (val === 'true') setIsAutenticado(true);
      setCarregando(false);
    });
  }, []);

  const login = () => {
    AsyncStorage.setItem('@nfone_auth', 'true');
    setIsAutenticado(true);
  };

  const logout = () => {
    AsyncStorage.removeItem('@nfone_auth');
    setIsAutenticado(false);
  };

  if (carregando) return null;

  return (
    <NavigationContainer>
      {!isAutenticado ? (
        <Login onLogin={login} />
      ) : (
        <MainLayout onLogout={logout} />
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', backgroundColor: '#0A0E1A' },
  sidebar: { width: 220, padding: 25, justifyContent: 'space-between' },
  logoContainer: { marginBottom: 40 },
  brand: { fontSize: 24, fontWeight: '800', letterSpacing: 2 },
  brandSub: { color: '#FFF', fontSize: 10, marginTop: 5, opacity: 0.6 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15 },
  menuText: { fontSize: 14 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 8, borderWidth: 1, justifyContent: 'center' },
  mainContent: { flex: 1 },
  topHeader: { height: 70, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 30 },
  searchBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, height: 35, borderRadius: 18, flex: 1, maxWidth: 300 },
  topProfile: { marginLeft: 'auto' }
});