import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Platform } from 'react-native';
import * as Print from 'expo-print';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';

export default function Faturamento({ isDarkMode }: any) {
    const [cliente, setCliente] = useState('');
    const [cnpj, setCnpj] = useState('');
    const [endereco, setEndereco] = useState('');
    const [dataEntrega, setDataEntrega] = useState('');
    const [equipamento, setEquipamento] = useState('');
    const [tag, setTag] = useState('');
    const [potencia, setPotencia] = useState('');
    const [formaRecebimento, setFormaRecebimento] = useState('');
    const [descricao, setDescricao] = useState('');
    const [valor, setValor] = useState('');

    const [logoBase64, setLogoBase64] = useState('');
    const COD_TRIBUTACAO = "14.01.01 - Manutenção de maquinário";

    useEffect(() => {
        async function carregarLogo() {
            try {
                const asset = Asset.fromModule(require('../../assets/wseBombasEMotores.png'));
                await asset.downloadAsync();
                const uri = asset.localUri || asset.uri;

                if (uri) {
                    if (Platform.OS === 'web') {
                        const response = await fetch(uri);
                        const blob = await response.blob();
                        const reader = new FileReader();
                        reader.onloadend = () => setLogoBase64(reader.result as string);
                        reader.readAsDataURL(blob);
                    } else {
                        const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
                        setLogoBase64(`data:image/png;base64,${base64}`);
                    }
                }
            } catch (error) {
                console.log("Aviso: Logo não carregada no código.", error);
            }
        }
        carregarLogo();
    }, []);

    const limparCampos = () => {
        setCliente('');
        setCnpj('');
        setEndereco('');
        setDataEntrega('');
        setEquipamento('');
        setTag('');
        setPotencia('');
        setFormaRecebimento('');
        setDescricao('');
        setValor('');
    };

    const gerarPDFWSE = async () => {
        const html = `
        <html>
        <head>
            <style>
                @page { margin: 0; }
                body { font-family: Helvetica, Arial, sans-serif; padding: 40px; color: #000; position: relative; }
                .logo-header { position: absolute; top: 30px; left: 30px; width: 80px; height: 80px; object-fit: contain; }
                .date { text-align: right; font-size: 14px; margin-bottom: 20px; margin-top: 10px; }
                .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 20px; margin-top: 30px; }
                .header h1 { margin: 0; font-size: 28px; letter-spacing: 2px; color: #000; }
                .header h3 { margin: 5px 0; font-weight: normal; color: #555; }
                .section { margin-bottom: 25px; }
                .section-title { background-color: #f0f0f0; padding: 8px; font-weight: bold; border-left: 4px solid #333; margin-bottom: 10px; }
                .row { margin-bottom: 6px; font-size: 14px; }
                .bold { font-weight: bold; }
                .total-box { margin-top: 30px; padding: 15px; border: 2px solid #000; text-align: right; font-size: 18px; font-weight: bold; }
                .desc-box { border: 1px solid #ccc; padding: 10px; min-height: 80px; font-size: 14px; white-space: pre-wrap; }
                .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #555; border-top: 1px solid #ccc; padding-top: 15px; }
                .direitos { font-size: 10px; color: #888; margin-top: 10px; display: block; }
            </style>
        </head>
        <body>
            ${logoBase64 ? `<img src="${logoBase64}" class="logo-header" />` : ''}
            <div class="date"><span class="bold">Data de Entrega:</span> ${dataEntrega}</div>
            <div class="header">
                <h1>WSE Bombas e Motores</h1>
                <h3>Nota de prestação de serviço</h3>
            </div>
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
            <div class="footer">
                <span class="bold">WSE BOMBAS E MOTORES ELÉTRICOS</span><br/>
                CNPJ: 58.054.890/0001-02 | Contato: (61) 99800-7873
                <span class="direitos">Todos os direitos reservados. WSE</span>
            </div>
        </body>
        </html>
        `;

        try {
            const numNota = `#${Math.floor(100 + Math.random() * 900)}`;
            const novaNota = { id: Date.now().toString(), numero: numNota, cliente: cliente || 'Sem Nome', data: dataEntrega, valor: valor || '0,00' };
            const notasSalvas = await AsyncStorage.getItem('@nfone_notas');
            const notasArray = notasSalvas ? JSON.parse(notasSalvas) : [];
            notasArray.unshift(novaNota);
            await AsyncStorage.setItem('@nfone_notas', JSON.stringify(notasArray));
        } catch (error) { console.error("Erro Cache:", error); }

        if (Platform.OS === 'web') {
            const printWindow = window.open('', '_blank');
            if (printWindow) {
                printWindow.document.write(html);
                printWindow.document.close();
                // Aumentei o timeout para garantir que o render do HTML ocorra completamente
                setTimeout(() => {
                    printWindow.print();
                    printWindow.close();

                    // Força a janela principal a recuperar o foco e limpa os campos para a próxima nota
                    window.focus();
                    limparCampos();
                }, 500);
            }
        } else {
            try {
                await Print.printAsync({ html });
                limparCampos();
            } catch (error) { console.error(error); }
        }
    };

    const theme = isDarkMode ? {
        bgApp: '#181824', bgCard: '#252533', textPrimary: '#FFFFFF', textSecondary: '#888888', border: '#333333', btnPrimary: '#38CE3C', textBtnPrimary: '#181824'
    } : {
        bgApp: '#F4F7FE', bgCard: '#FFFFFF', textPrimary: '#1E293B', textSecondary: '#64748B', border: '#E2E8F0', btnPrimary: '#0056D2', textBtnPrimary: '#FFFFFF'
    };

    return (
        <ScrollView
            style={{ flex: 1, backgroundColor: theme.bgApp }}
            contentContainerStyle={{ padding: 40, paddingBottom: 100 }}
            keyboardShouldPersistTaps="handled"
        >
            <Text style={[styles.title, { color: theme.textPrimary }]}>Gerar Nota Fiscal</Text>

            <View style={[styles.card, { backgroundColor: theme.bgCard }]}>
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

                <TouchableOpacity style={[styles.button, { backgroundColor: theme.btnPrimary }]} onPress={gerarPDFWSE}>
                    <Text style={[styles.buttonText, { color: theme.textBtnPrimary }]}>GERAR PDF WSE</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
    card: { padding: 30, borderRadius: 12, marginBottom: 40 },
    sectionLabel: { fontWeight: 'bold', marginBottom: 15, textTransform: 'uppercase', fontSize: 13 },
    input: { padding: 15, borderRadius: 8, marginBottom: 15, borderWidth: 1 },
    button: { padding: 18, borderRadius: 8, alignItems: 'center', marginTop: 10 },
    buttonText: { fontWeight: 'bold', fontSize: 16 }
});