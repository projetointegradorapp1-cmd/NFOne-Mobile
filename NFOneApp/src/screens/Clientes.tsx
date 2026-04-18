import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const theme = {
    bgApp: '#181824',
    bgCard: '#252533',
    textPrimary: '#FFFFFF',
    textSecondary: '#A0A4B8',
    border: '#333333',
    accent: '#00C6FF',
    success: '#22C55E',
    danger: '#EF4444'
};

export default function Clientes() {
    const [nome, setNome] = useState('');
    const [status, setStatus] = useState('Pendente');
    const [lista, setLista] = useState<any[]>([]);

    useEffect(() => { carregarDados(); }, []);

    const carregarDados = async () => {
        const salvos = await AsyncStorage.getItem('@nfone_atendimentos');
        if (salvos) setLista(JSON.parse(salvos));
    };

    const salvarCliente = async () => {
        if (!nome) return;
        const novo = { id: Date.now().toString(), nome, status };
        const novaLista = [novo, ...lista];
        await AsyncStorage.setItem('@nfone_atendimentos', JSON.stringify(novaLista));
        setLista(novaLista);
        setNome('');
    };

    const remover = async (id: string) => {
        const novaLista = lista.filter(item => item.id !== id);
        await AsyncStorage.setItem('@nfone_atendimentos', JSON.stringify(novaLista));
        setLista(novaLista);
    };

    return (
        <View style={{ flex: 1, backgroundColor: theme.bgApp, padding: 40 }}>
            <Text style={styles.title}>Gestão de Atendimentos</Text>

            {/* Formulário */}
            <View style={styles.card}>
                <TextInput
                    style={styles.input}
                    placeholder="Nome do Cliente"
                    placeholderTextColor={theme.textSecondary}
                    value={nome}
                    onChangeText={setNome}
                />
                <View style={styles.row}>
                    <TouchableOpacity
                        style={[styles.statusBtn, status === 'Pendente' && { borderColor: theme.accent }]}
                        onPress={() => setStatus('Pendente')}
                    >
                        <Text style={{ color: status === 'Pendente' ? theme.accent : theme.textSecondary }}>A Atender</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.statusBtn, status === 'Atendido' && { borderColor: theme.success }]}
                        onPress={() => setStatus('Atendido')}
                    >
                        <Text style={{ color: status === 'Atendido' ? theme.success : theme.textSecondary }}>Atendido</Text>
                    </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.btnSalvar} onPress={salvarCliente}>
                    <Text style={{ fontWeight: 'bold' }}>ADICIONAR À LISTA</Text>
                </TouchableOpacity>
            </View>

            {/* Listagem */}
            <ScrollView>
                {lista.map(item => (
                    <View key={item.id} style={styles.listItem}>
                        <View>
                            <Text style={{ color: '#FFF', fontWeight: 'bold' }}>{item.nome}</Text>
                            <Text style={{ color: item.status === 'Atendido' ? theme.success : theme.accent, fontSize: 12 }}>
                                {item.status}
                            </Text>
                        </View>
                        <TouchableOpacity onPress={() => remover(item.id)}>
                            <Feather name="trash-2" size={18} color={theme.danger} />
                        </TouchableOpacity>
                    </View>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    title: { fontSize: 24, fontWeight: 'bold', color: '#FFF', marginBottom: 20 },
    card: { backgroundColor: theme.bgCard, padding: 25, borderRadius: 12, marginBottom: 30 },
    input: { borderBottomWidth: 1, borderColor: theme.border, color: '#FFF', padding: 10, marginBottom: 20 },
    row: { flexDirection: 'row', gap: 10, marginBottom: 20 },
    statusBtn: { flex: 1, padding: 10, borderWidth: 1, borderRadius: 8, alignItems: 'center', borderColor: theme.border },
    btnSalvar: { backgroundColor: theme.success, padding: 15, borderRadius: 8, alignItems: 'center' },
    listItem: { backgroundColor: theme.bgCard, padding: 15, borderRadius: 8, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }
});