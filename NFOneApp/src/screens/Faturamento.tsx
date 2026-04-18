import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Platform } from 'react-native';
import * as Print from 'expo-print';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Faturamento({ isDarkMode }: any) {
    // Dados do Tomador
    const [cliente, setCliente] = useState('');
    const [cnpj, setCnpj] = useState('');
    const [endereco, setEndereco] = useState('');
    const [dataEntrega, setDataEntrega] = useState('');

    // Detalhes do Trabalho
    const [equipamento, setEquipamento] = useState('');
    const [tag, setTag] = useState('');
    const [potencia, setPotencia] = useState('');
    const [formaRecebimento, setFormaRecebimento] = useState('');
    const [descricao, setDescricao] = useState('');
    const [valor, setValor] = useState('');

    const COD_TRIBUTACAO = "14.01.01 - Manutenção de maquinário";

    const gerarPDFMotrix = async () => {
        // 1. O Visual do PDF
        const html = `
        <html>
        <head>
            <style>
            body { font-family: Helvetica, Arial, sans-serif; padding: 30px; color: #000; }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 20px; }
            .header h1 { margin: 0; font-size: 28px; letter-spacing: 2px; color: #000; }
            .header h3 { margin: 5px 0; font-weight: normal; color: #555; }
            .date { text-align: right; font-size: 14px; margin-bottom: 20px; }
            .section { margin-bottom: 25px; }
            .section-title { background-color: #f0f0f0; padding: 8px; font-weight: bold; border-left: 4px solid #333; margin-bottom: 10px; }
            .row { margin-bottom: 6px; font-size: 14px; }
            .bold { font-weight: bold; }
            .total-box { margin-top: 30px; padding: 15px; border: 2px solid #000; text-align: right; font-size: 18px; font-weight: bold; }
            .desc-box { border: 1px solid #ccc; padding: 10px; min-height: 80px; font-size: 14px; white-space: pre-wrap; }
            </style>
        </head>
        <body>
            <div class="date"><span class="bold">Data de Entrega:</span> ${dataEntrega}</div>
            <div class="header"><h1>MOTRIX</h1><h3>Relatório de Prestação de Serviço</h3></div>
            <div class="section">
            <div class="section-title">DADOS DO TOMADOR (CLIENTE)</div>
            <div class="row"><span class="bold">Nome/Razão Social:</span> ${cliente}</div>
            <div class="row"><span class="bold">CNPJ:</span> ${cnpj}</div>
            <div class="row"><span class="bold">Endereço:</span> ${endereco}</div>
            </div>
            <div class="section">
            <div class="section-title">DETALHES DO TRABALHO</div>
            <div class="row"><span class="bold">Equipamento:</span> ${equipamento} | <span class="bold">TAG:</span> ${tag}</div>
            <div class="row"><span class="bold">Potência:</span> ${potencia}</div>
            <div class="row"><span class="bold">Código de Tributação:</span> ${COD_TRIBUTACAO}</div>
            <div class="row"><span class="bold">Forma de Recebimento:</span> ${formaRecebimento}</div>
            <div style="margin-top: 15px;">
                <div class="bold" style="margin-bottom: 5px;">Descrição dos Serviços:</div>
                <div class="desc-box">${descricao}</div>
            </div>
            </div>
            <div class="total-box">Valor Total: R$ ${valor}</div>
        </body>
        </html>
    `;

        // 2. Lógica de Salvar no Cache do PC
        try {
            const numNota = `#${Math.floor(100 + Math.random() * 900)}`;
            const novaNota = {
                id: Date.now().toString(),
                numero: numNota,
                cliente: cliente || 'Cliente Sem Nome',
                data: dataEntrega || 'Sem data',
                valor: valor || '0,00'
            };

            const notasSalvas = await AsyncStorage.getItem('@nfone_notas');
            const notasArray = notasSalvas ? JSON.parse(notasSalvas) : [];

            notasArray.unshift(novaNota);
            await AsyncStorage.setItem('@nfone_notas', JSON.stringify(notasArray));

            if (Platform.OS === 'web') alert(`Nota ${numNota} salva com sucesso no sistema!`);
        } catch (error) {
            console.error("Erro ao salvar no Cache:", error);
        }

        // 3. Lógica de Imprimir no PC
        if (Platform.OS === 'web') {
            const printWindow = window.open('', '_blank');
            if (printWindow) {
                printWindow.document.write(html);
                printWindow.document.close();
                printWindow.focus();
                setTimeout(() => {
                    printWindow.print();
                    printWindow.close();
                }, 250);
            }
        } else {
            try {
                await Print.printAsync({ html });
            } catch (error) {
                console.error("Erro ao gerar PDF:", error);
            }
        }
    };

    // === CORES DINÂMICAS DO TEMA ===
    const theme = isDarkMode ? {
        bgApp: '#181824', bgCard: '#252533', textPrimary: '#FFFFFF',
        textSecondary: '#888888', border: '#333333', btnPrimary: '#38CE3C', textBtnPrimary: '#181824'
    } : {
        bgApp: '#F4F7FE', bgCard: '#FFFFFF', textPrimary: '#1E293B',
        textSecondary: '#64748B', border: '#E2E8F0', btnPrimary: '#0056D2', textBtnPrimary: '#FFFFFF'
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.bgApp }]}>
            <Text style={[styles.title, { color: theme.textPrimary }]}>Gerar Relatório Motrix</Text>

            <View style={[styles.card, { backgroundColor: theme.bgCard, elevation: isDarkMode ? 0 : 2, shadowOpacity: isDarkMode ? 0 : 0.05 }]}>
                <Text style={[styles.sectionLabel, { color: theme.btnPrimary }]}>Dados do Cliente</Text>

                <TextInput style={[styles.input, { borderColor: theme.border, color: theme.textPrimary, backgroundColor: theme.bgApp }]}
                    placeholder="Nome/Razão Social" placeholderTextColor={theme.textSecondary} value={cliente} onChangeText={setCliente} />

                <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TextInput style={[styles.input, { flex: 1, borderColor: theme.border, color: theme.textPrimary, backgroundColor: theme.bgApp }]}
                        placeholder="CNPJ" placeholderTextColor={theme.textSecondary} value={cnpj} onChangeText={setCnpj} />
                    <TextInput style={[styles.input, { flex: 1, borderColor: theme.border, color: theme.textPrimary, backgroundColor: theme.bgApp }]}
                        placeholder="Data (DD/MM/AAAA)" placeholderTextColor={theme.textSecondary} value={dataEntrega} onChangeText={setDataEntrega} />
                </View>

                <TextInput style={[styles.input, { borderColor: theme.border, color: theme.textPrimary, backgroundColor: theme.bgApp }]}
                    placeholder="Endereço Completo" placeholderTextColor={theme.textSecondary} value={endereco} onChangeText={setEndereco} />

                <Text style={[styles.sectionLabel, { marginTop: 10, color: theme.btnPrimary }]}>Detalhes Técnicos</Text>

                <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TextInput style={[styles.input, { flex: 1, borderColor: theme.border, color: theme.textPrimary, backgroundColor: theme.bgApp }]}
                        placeholder="Equipamento" placeholderTextColor={theme.textSecondary} value={equipamento} onChangeText={setEquipamento} />
                    <TextInput style={[styles.input, { flex: 1, borderColor: theme.border, color: theme.textPrimary, backgroundColor: theme.bgApp }]}
                        placeholder="TAG" placeholderTextColor={theme.textSecondary} value={tag} onChangeText={setTag} />
                </View>

                <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TextInput style={[styles.input, { flex: 1, borderColor: theme.border, color: theme.textPrimary, backgroundColor: theme.bgApp }]}
                        placeholder="Potência" placeholderTextColor={theme.textSecondary} value={potencia} onChangeText={setPotencia} />
                    <TextInput style={[styles.input, { flex: 1, borderColor: theme.border, color: theme.textPrimary, backgroundColor: theme.bgApp }]}
                        placeholder="Recebimento (Ex: PIX)" placeholderTextColor={theme.textSecondary} value={formaRecebimento} onChangeText={setFormaRecebimento} />
                </View>

                <TextInput style={[styles.input, { height: 80, borderColor: theme.border, color: theme.textPrimary, backgroundColor: theme.bgApp }]}
                    placeholder="Descrição dos Serviços" multiline placeholderTextColor={theme.textSecondary} value={descricao} onChangeText={setDescricao} />

                <TextInput style={[styles.input, { borderColor: theme.border, color: theme.textPrimary, backgroundColor: theme.bgApp }]}
                    placeholder="Valor Total R$" keyboardType="numeric" placeholderTextColor={theme.textSecondary} value={valor} onChangeText={setValor} />

                <TouchableOpacity style={[styles.button, { backgroundColor: theme.btnPrimary }]} onPress={gerarPDFMotrix}>
                    <Text style={[styles.buttonText, { color: theme.textBtnPrimary }]}>GERAR PDF PERSONALIZADO</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 40 },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
    card: { padding: 30, borderRadius: 12, marginBottom: 40, shadowColor: '#000', shadowRadius: 10 },
    sectionLabel: { fontWeight: 'bold', marginBottom: 15, textTransform: 'uppercase', fontSize: 13 },
    input: { padding: 15, borderRadius: 8, marginBottom: 15, borderWidth: 1 },
    button: { padding: 18, borderRadius: 8, alignItems: 'center', marginTop: 10 },
    buttonText: { fontWeight: 'bold', fontSize: 16 }
});