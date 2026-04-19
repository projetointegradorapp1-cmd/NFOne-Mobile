import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function CatalogoTecnico({ isDarkMode }: any) {
    const [busca, setBusca] = useState('');
    const [motores, setMotores] = useState<any[]>([]);

    const carregarCatalogo = async () => {
        try {
            const salvos = await AsyncStorage.getItem('@nfone_equipamentos');
            if (salvos) {
                setMotores((Array.isArray(JSON.parse(salvos)) ? JSON.parse(salvos) : []));
            } else {
                const exemplos = [{ id: '1', tipo: 'Bomba Centrífuga', potencia: '2.0 CV', rpm: '3500', tensao: '220V' }];
                await AsyncStorage.setItem('@nfone_equipamentos', JSON.stringify(exemplos));
                setMotores(exemplos);
            }
        } catch (error) { console.error(error); }
    };

    const removerEquipamento = async (idParaRemover: string) => {
        if (Platform.OS === 'web' && !window.confirm("Deseja excluir este equipamento?")) return;
        try {
            const novaLista = motores.filter((motor) => motor.id !== idParaRemover);
            await AsyncStorage.setItem('@nfone_equipamentos', JSON.stringify(novaLista));
            setMotores(novaLista);
        } catch (error) { console.error(error); }
    };

    useEffect(() => { carregarCatalogo(); }, []);

    const motoresFiltrados = motores.filter(motor =>
        motor.tipo.toLowerCase().includes(busca.toLowerCase()) || motor.potencia.includes(busca)
    );

    const theme = isDarkMode ? {
        bgApp: '#181824', bgCard: '#252533', textPrimary: '#FFFFFF', textSecondary: '#888888', border: '#333333', btnPrimary: '#38CE3C'
    } : {
        bgApp: '#F4F7FE', bgCard: '#FFFFFF', textPrimary: '#1E293B', textSecondary: '#64748B', border: '#E2E8F0', btnPrimary: '#0056D2'
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.bgApp }]}>
            <Text style={[styles.title, { color: theme.textPrimary }]}>Catálogo Técnico Integrado</Text>

            <View style={styles.searchContainer}>
                <TextInput
                    style={[styles.searchInput, { backgroundColor: theme.bgApp, color: theme.textPrimary, borderColor: theme.border }]}
                    placeholder="Buscar equipamento..." placeholderTextColor={theme.textSecondary}
                    value={busca} onChangeText={setBusca}
                />
            </View>

            <View style={[styles.tableContainer, { backgroundColor: theme.bgCard, elevation: isDarkMode ? 0 : 2, shadowOpacity: isDarkMode ? 0 : 0.05 }]}>
                <View style={[styles.tableHeader, { borderBottomColor: theme.border }]}>
                    <Text style={[styles.tableHeaderText, { flex: 2, color: theme.textSecondary }]}>Linha de Equipamento</Text>
                    <Text style={[styles.tableHeaderText, { flex: 1, color: theme.textSecondary }]}>Potência (CV)</Text>
                    <Text style={[styles.tableHeaderText, { flex: 1, color: theme.textSecondary }]}>Rotação</Text>
                    <Text style={[styles.tableHeaderText, { flex: 1, color: theme.textSecondary }]}>Tensão</Text>
                    <Text style={[styles.tableHeaderText, { flex: 0.5, textAlign: 'center', color: theme.textSecondary }]}>Ação</Text>
                </View>

                {motoresFiltrados.length === 0 ? (
                    <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Nenhum equipamento.</Text>
                ) : (
                    motoresFiltrados.map((motor) => (
                        <View key={motor.id} style={[styles.tableRow, { borderBottomColor: theme.border }]}>
                            <Text style={[styles.tableCell, { flex: 2, color: theme.btnPrimary, fontWeight: 'bold' }]}>{motor.tipo}</Text>
                            <Text style={[styles.tableCell, { flex: 1, color: theme.textPrimary }]}>{motor.potencia}</Text>
                            <Text style={[styles.tableCell, { flex: 1, color: theme.textPrimary }]}>{motor.rpm}</Text>
                            <Text style={[styles.tableCell, { flex: 1, color: theme.textPrimary }]}>{motor.tensao}</Text>
                            <TouchableOpacity style={{ flex: 0.5, alignItems: 'center' }} onPress={() => removerEquipamento(motor.id)}>
                                <Text style={styles.deleteText}>Excluir</Text>
                            </TouchableOpacity>
                        </View>
                    ))
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 40 },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
    searchContainer: { marginBottom: 30 },
    searchInput: { padding: 15, borderRadius: 8, borderWidth: 1, fontSize: 16 },
    tableContainer: { borderRadius: 12, padding: 25, shadowColor: '#000', shadowRadius: 10 },
    tableHeader: { flexDirection: 'row', borderBottomWidth: 1, paddingBottom: 15, marginBottom: 15 },
    tableHeaderText: { fontWeight: 'bold', fontSize: 13, textTransform: 'uppercase' },
    tableRow: { flexDirection: 'row', paddingVertical: 15, borderBottomWidth: 1, alignItems: 'center' },
    tableCell: { fontSize: 15 },
    emptyText: { fontStyle: 'italic', marginTop: 10, textAlign: 'center' },
    deleteText: { color: '#EF4444', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' }
});