import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Logistica({ isDarkMode }: any) {
    const [tipoMovimentacao, setTipoMovimentacao] = useState('Coleta');
    const [cliente, setCliente] = useState('');
    const [equipamento, setEquipamento] = useState('');
    const [data, setData] = useState('');
    const [status, setStatus] = useState('Pendente');
    const [ordens, setOrdens] = useState<any[]>([]);

    const carregarOS = async () => {
        try {
            const salvos = await AsyncStorage.getItem('@nfone_os');
            if (salvos) setOrdens(JSON.parse(salvos));
        } catch (error) { console.error(error); }
    };

    useEffect(() => { carregarOS(); }, []);

    const salvarOS = async () => {
        if (!cliente || !equipamento || !data) return alert("Preencha os campos obrigatórios!");
        const novaOS = { id: Date.now().toString(), numeroOS: `OS-${Math.floor(1000 + Math.random() * 9000)}`, tipo: tipoMovimentacao, cliente, equipamento, data, status };
        try {
            const novaLista = [novaOS, ...ordens];
            await AsyncStorage.setItem('@nfone_os', JSON.stringify(novaLista));
            setOrdens(novaLista);
            setCliente(''); setEquipamento(''); setData(''); setStatus('Pendente');
        } catch (error) { console.error(error); }
    };

    const removerOS = async (idParaRemover: string) => {
        if (Platform.OS === 'web' && !window.confirm("Deseja excluir?")) return;
        try {
            const novaLista = ordens.filter(os => os.id !== idParaRemover);
            await AsyncStorage.setItem('@nfone_os', JSON.stringify(novaLista));
            setOrdens(novaLista);
        } catch (error) { console.error(error); }
    };

    const theme = isDarkMode ? {
        bgApp: '#181824', bgCard: '#252533', textPrimary: '#FFFFFF', textSecondary: '#888888', border: '#333333', btnPrimary: '#38CE3C', textBtnPrimary: '#181824'
    } : {
        bgApp: '#F4F7FE', bgCard: '#FFFFFF', textPrimary: '#1E293B', textSecondary: '#64748B', border: '#E2E8F0', btnPrimary: '#0056D2', textBtnPrimary: '#FFFFFF'
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.bgApp }]}>
            <Text style={[styles.title, { color: theme.textPrimary }]}>Painel de Logística</Text>

            <View style={[styles.card, { backgroundColor: theme.bgCard, elevation: isDarkMode ? 0 : 2 }]}>
                <Text style={[styles.sectionLabel, { color: theme.btnPrimary }]}>Nova Ordem de Serviço (OS)</Text>

                <View style={styles.row}>
                    <TouchableOpacity style={[styles.typeButton, { borderColor: theme.border }, tipoMovimentacao === 'Coleta' && { backgroundColor: theme.btnPrimary, borderColor: theme.btnPrimary }]} onPress={() => setTipoMovimentacao('Coleta')}>
                        <Text style={[styles.typeButtonText, { color: theme.textPrimary }, tipoMovimentacao === 'Coleta' && { color: theme.textBtnPrimary }]}>COLETA</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.typeButton, { borderColor: theme.border }, tipoMovimentacao === 'Entrega' && { backgroundColor: theme.btnPrimary, borderColor: theme.btnPrimary }]} onPress={() => setTipoMovimentacao('Entrega')}>
                        <Text style={[styles.typeButtonText, { color: theme.textPrimary }, tipoMovimentacao === 'Entrega' && { color: theme.textBtnPrimary }]}>ENTREGA</Text>
                    </TouchableOpacity>
                </View>

                <TextInput style={[styles.input, { borderColor: theme.border, color: theme.textPrimary, backgroundColor: theme.bgApp }]} placeholder="Cliente / Empresa" placeholderTextColor={theme.textSecondary} value={cliente} onChangeText={setCliente} />
                <TextInput style={[styles.input, { borderColor: theme.border, color: theme.textPrimary, backgroundColor: theme.bgApp }]} placeholder="Equipamento" placeholderTextColor={theme.textSecondary} value={equipamento} onChangeText={setEquipamento} />

                <View style={styles.row}>
                    <TextInput style={[styles.input, { flex: 1, borderColor: theme.border, color: theme.textPrimary, backgroundColor: theme.bgApp }]} placeholder="Data Prevista" placeholderTextColor={theme.textSecondary} value={data} onChangeText={setData} />
                    <TextInput style={[styles.input, { flex: 1, borderColor: theme.border, color: theme.textPrimary, backgroundColor: theme.bgApp }]} placeholder="Status" placeholderTextColor={theme.textSecondary} value={status} onChangeText={setStatus} />
                </View>

                <TouchableOpacity style={[styles.button, { backgroundColor: theme.btnPrimary }]} onPress={salvarOS}>
                    <Text style={[styles.buttonText, { color: theme.textBtnPrimary }]}>REGISTRAR OS</Text>
                </TouchableOpacity>
            </View>

            <View style={[styles.tableContainer, { backgroundColor: theme.bgCard, elevation: isDarkMode ? 0 : 2 }]}>
                <View style={[styles.tableHeader, { borderBottomColor: theme.border }]}>
                    <Text style={[styles.tableHeaderText, { flex: 1, color: theme.textSecondary }]}>OS</Text>
                    <Text style={[styles.tableHeaderText, { flex: 1, color: theme.textSecondary }]}>Tipo</Text>
                    <Text style={[styles.tableHeaderText, { flex: 2, color: theme.textSecondary }]}>Equipamento</Text>
                    <Text style={[styles.tableHeaderText, { flex: 1, color: theme.textSecondary }]}>Data</Text>
                    <Text style={[styles.tableHeaderText, { flex: 1, color: theme.textSecondary }]}>Status</Text>
                    <Text style={[styles.tableHeaderText, { flex: 0.5, textAlign: 'center', color: theme.textSecondary }]}>Ação</Text>
                </View>

                {ordens.map((os) => (
                    <View key={os.id} style={[styles.tableRow, { borderBottomColor: theme.border }]}>
                        <Text style={[styles.tableCell, { flex: 1, color: theme.btnPrimary, fontWeight: 'bold' }]}>{os.numeroOS}</Text>
                        <Text style={[styles.tableCell, { flex: 1, color: os.tipo === 'Coleta' ? '#FF9500' : theme.btnPrimary, fontWeight: 'bold' }]}>{os.tipo}</Text>
                        <View style={{ flex: 2, justifyContent: 'center' }}>
                            <Text style={[styles.tableCell, { fontWeight: 'bold', color: theme.textPrimary }]}>{os.equipamento}</Text>
                            <Text style={{ fontSize: 12, color: theme.textSecondary }}>{os.cliente}</Text>
                        </View>
                        <Text style={[styles.tableCell, { flex: 1, color: theme.textPrimary }]}>{os.data}</Text>
                        <Text style={[styles.tableCell, { flex: 1, color: theme.textPrimary }]}>{os.status}</Text>
                        <TouchableOpacity style={{ flex: 0.5, alignItems: 'center' }} onPress={() => removerOS(os.id)}>
                            <Text style={styles.deleteText}>Excluir</Text>
                        </TouchableOpacity>
                    </View>
                ))}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 40 },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
    card: { padding: 25, borderRadius: 12, marginBottom: 30 },
    sectionLabel: { fontWeight: 'bold', marginBottom: 15, textTransform: 'uppercase', fontSize: 14 },
    row: { flexDirection: 'row', gap: 10, marginBottom: 15 },
    input: { padding: 15, borderRadius: 8, borderWidth: 1, marginBottom: 15 },
    typeButton: { flex: 1, padding: 15, borderRadius: 8, borderWidth: 1, alignItems: 'center' },
    typeButtonText: { fontWeight: 'bold' },
    button: { padding: 18, borderRadius: 8, alignItems: 'center', marginTop: 10 },
    buttonText: { fontWeight: 'bold', fontSize: 16 },
    tableContainer: { borderRadius: 12, padding: 25 },
    tableHeader: { flexDirection: 'row', borderBottomWidth: 1, paddingBottom: 15, marginBottom: 15 },
    tableHeaderText: { fontWeight: 'bold', fontSize: 13, textTransform: 'uppercase' },
    tableRow: { flexDirection: 'row', paddingVertical: 15, borderBottomWidth: 1, alignItems: 'center' },
    tableCell: { fontSize: 14 },
    deleteText: { color: '#EF4444', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' }
});