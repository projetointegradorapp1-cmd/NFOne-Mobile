import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AntDesign } from '@expo/vector-icons';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

// Isso aqui resolve o erro do TypeScript (IntrinsicAttributes)
interface LoginProps {
    onLogin: () => void;
}

export default function Login({ onLogin }: LoginProps) {

    const [request, response, promptAsync] = Google.useAuthRequest({
        // COLAR O SEU ID DO GOOGLE AQUI EMBAIXO:
        webClientId: '621925164668-k1689pl0604nhr6krj17g6fm1lhtcrb6.apps.googleusercontent.com',
    });

    useEffect(() => {
        if (response?.type === 'success') {
            onLogin();
        }
    }, [response]);

    return (
        <View style={styles.container}>
            <View style={styles.loginCard}>

                <LinearGradient
                    colors={['#614DFF', '#2D2B5A']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.brandingSide}
                >
                    <Text style={styles.brandTitle}>MOTRIX</Text>
                    <Text style={styles.brandSubtitle}>Sistema de Gestão Operacional</Text>

                    <View style={styles.divider} />
                    <Text style={styles.brandText}>
                        Acesse o sistema utilizando a conta corporativa. Todos os seus dados de faturamento e
                        catálogo técnico permanecerão salvos localmente nesta máquina.
                    </Text>
                </LinearGradient>

                <View style={styles.formSide}>
                    <Text style={styles.loginTitle}>Bem-vinda!</Text>
                    <Text style={styles.loginSubtitle}>Faça login de forma rápida e segura.</Text>

                    <TouchableOpacity
                        style={[styles.googleBtn, !request && { opacity: 0.7 }]}
                        disabled={!request}
                        onPress={() => promptAsync()}
                    >
                        <AntDesign name="google" size={24} color="#DB4437" style={styles.googleIcon} />
                        <Text style={styles.googleBtnText}>Entrar com o Google</Text>
                    </TouchableOpacity>

                    <Text style={styles.secureText}>🔒 Autenticação criptografada de ponta a ponta.</Text>
                </View>

            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F6FA', justifyContent: 'center', alignItems: 'center', padding: 20 },
    loginCard: { flexDirection: 'row', width: '100%', maxWidth: 900, height: 500, backgroundColor: '#FFFFFF', borderRadius: 24, shadowColor: '#8C98A4', shadowOpacity: 0.15, shadowRadius: 30, shadowOffset: { width: 0, height: 15 }, elevation: 10, overflow: 'hidden' },
    brandingSide: { flex: 1, padding: 50, justifyContent: 'center' },
    brandTitle: { color: '#FFF', fontSize: 42, fontWeight: '900', letterSpacing: 2, marginBottom: 10 },
    brandSubtitle: { color: '#E0D4FF', fontSize: 16, fontWeight: '600', marginBottom: 30 },
    divider: { width: 50, height: 4, backgroundColor: '#FF7B93', borderRadius: 2, marginBottom: 30 },
    brandText: { color: '#C5B4E3', fontSize: 14, lineHeight: 22 },
    formSide: { flex: 1, padding: 50, justifyContent: 'center', backgroundColor: '#FFFFFF', alignItems: 'center' },
    loginTitle: { fontSize: 28, fontWeight: '800', color: '#2B2D42', marginBottom: 10, alignSelf: 'flex-start' },
    loginSubtitle: { fontSize: 14, color: '#8D99AE', marginBottom: 50, alignSelf: 'flex-start' },
    googleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', width: '100%', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 3 },
    googleIcon: { marginRight: 15 },
    googleBtnText: { color: '#333', fontWeight: 'bold', fontSize: 16 },
    secureText: { color: '#A0A4B8', fontSize: 12, marginTop: 30 }
});