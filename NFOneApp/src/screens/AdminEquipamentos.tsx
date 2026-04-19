import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AdminEquipamentos({ isDarkMode }: any) {
    const [tipo, setTipo] = useState('');
    const [potencia, setPotencia] = useState('');
    const [rpm, setRpm] = useState('');
    const [tensao, setTensao] = useState('');

    const salvarEquipamento = async () => {
        if (!tipo || !potencia) return alert("Preencha Tipo e Potência.");
        const novoEquipamento = { id: Date.now().toString(), tipo, potencia, rpm: rpm || '-', tensao: tensao || '-' };
        try {
            const salvos = await AsyncStorage.getItem('@nfone_equipamentos');
            const listaArray = salvos ? (Array.isArray(JSON.parse(salvos)) ? JSON.parse(salvos) : []) : [];
            listaArray.push(novoEquipamento);
            await AsyncStorage.setItem('@nfone_equipamentos', JSON.stringify(listaArray));
            alert("Equipamento cadastrado!");
            setTipo(''); setPotencia(''); setRpm(''); setTensao('');
        } catch (error) { console.error(error); }
    };

    const theme = isDarkMode ? {
        bgApp: '#181824', bgCard: '#252533', textPrimary: '#FFFFFF', textSecondary: '#888888', border: '#333333', btnPrimary: '#38CE3C', textBtnPrimary: '#181824'
    } : {
        bgApp: '#F4F7FE', bgCard: '#FFFFFF', textPrimary: '#1E293B', textSecondary: '#64748B', border: '#E2E8F0', btnPrimary: '#0056D2', textBtnPrimary: '#FFFFFF'
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.bgApp }]}>
            <Text style={[styles.title, { color: theme.textPrimary }]}>Painel Administrativo</Text>

            <View style={[styles.card, { backgroundColor: theme.bgCard, elevation: isDarkMode ? 0 : 2 }]}>
                <Text style={[styles.sectionLabel, { color: theme.btnPrimary }]}>Novo Equipamento</Text>

                <TextInput style={[styles.input, { borderColor: theme.border, color: theme.textPrimary, backgroundColor: theme.bgApp }]} placeholder="Linha/Tipo (Ex: Motor Indução)" placeholderTextColor={theme.textSecondary} value={tipo} onChangeText={setTipo} />

                <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TextInput style={[styles.input, { flex: 1, borderColor: theme.border, color: theme.textPrimary, backgroundColor: theme.bgApp }]} placeholder="Potência (Ex: 5.0 CV)" placeholderTextColor={theme.textSecondary} value={potencia} onChangeText={setPotencia} />
                    <TextInput style={[styles.input, { flex: 1, borderColor: theme.border, color: theme.textPrimary, backgroundColor: theme.bgApp }]} placeholder="Rotação (Ex: 1750 RPM)" placeholderTextColor={theme.textSecondary} value={rpm} onChangeText={setRpm} />
                </View>

                <TextInput style={[styles.input, { borderColor: theme.border, color: theme.textPrimary, backgroundColor: theme.bgApp }]} placeholder="Tensão Nominal (Ex: 220/380V)" placeholderTextColor={theme.textSecondary} value={tensao} onChangeText={setTensao} />

                <TouchableOpacity style={[styles.button, { backgroundColor: theme.btnPrimary }]} onPress={salvarEquipamento}>
                    <Text style={[styles.buttonText, { color: theme.textBtnPrimary }]}>CADASTRAR EQUIPAMENTO</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 40 },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
    card: { padding: 25, borderRadius: 12 },
    sectionLabel: { fontWeight: 'bold', marginBottom: 15, textTransform: 'uppercase', fontSize: 14 },
    input: { padding: 15, borderRadius: 8, marginBottom: 15, borderWidth: 1 },
    button: { padding: 18, borderRadius: 8, alignItems: 'center', marginTop: 10 },
    buttonText: { fontWeight: 'bold', fontSize: 16 }
});