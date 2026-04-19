import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Platform } from 'react-native';
import * as Print from 'expo-print';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';

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

    // Dados Fixos do Prestador (WSE)
    const PRESTADOR = {
        razaoSocial: "WSE BOMBAS E MOTORES ELETRICOS LTDA",
        nomeFantasia: "WSE BOMBAS E MOTORES ELETRICOS",
        cnpj: "58.054.890/0001-02",
        localidade: "Brasília - Distrito Federal | Brasil",
        email: "wsebombas@gmail.com"
    };

    useEffect(() => {
        async function carregarLogo() {
            try {
                const asset = Asset.fromModule(require('../../assets/LogotipoWSE.png'));
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
                console.log("Aviso: Logo não carregada.", error);
            }
        }
        carregarLogo();
    }, []);

    const limparCampos = () => {
        setCliente(''); setCnpj(''); setEndereco(''); setDataEntrega('');
        setEquipamento(''); setTag(''); setPotencia(''); setFormaRecebimento('');
        setDescricao(''); setValor('');
    };

    const gerarPDFWSE = async () => {
        const html = `
        <html>
        <head>
            <style>
                @page { margin: 0; }
                body { font-family: Helvetica, Arial, sans-serif; padding: 40px; color: #000; }
                .logo-header { position: absolute; top: 30px; left: 30px; width: 80px; height: 80px; object-fit: contain; }
                .date { text-align: right; font-size: 14px; margin-bottom: 20px; }
                .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 20px; margin-top: 30px; }
                .header h1 { margin: 0; font-size: 26px; }
                .section { margin-bottom: 20px; }
                .section-title { background-color: #f0f0f0; padding: 8px; font-weight: bold; border-left: 4px solid #333; margin-bottom: 10px; font-size: 12px; }
                .row { margin-bottom: 4px; font-size: 13px; }
                .bold { font-weight: bold; }
                .total-box { margin-top: 20px; padding: 15px; border: 2px solid #000; text-align: right; font-size: 18px; font-weight: bold; }
                .desc-box { border: 1px solid #ccc; padding: 10px; min-height: 80px; font-size: 13px; white-space: pre-wrap; margin-bottom: 10px; }
                .footer { margin-top: 40px; text-align: center; font-size: 11px; border-top: 1px solid #ccc; padding-top: 10px; }
            </style>
        </head>
        <body>
            ${logoBase64 ? `<img src="${logoBase64}" class="logo-header" />` : ''}
            <div class="date"><span class="bold">Data de Entrega:</span> ${dataEntrega}</div>
            <div class="header">
                <h1>WSE Bombas e Motores</h1>
                <h3>Nota de Prestação de Serviço</h3>
            </div>

            <div class="section">
                <div class="section-title">IDENTIFICAÇÃO DO PRESTADOR</div>
                <div class="row"><span class="bold">Razão Social:</span> ${PRESTADOR.razaoSocial}</div>
                <div class="row"><span class="bold">Nome Fantasia:</span> ${PRESTADOR.nomeFantasia}</div>
                <div class="row"><span class="bold">CNPJ:</span> ${PRESTADOR.cnpj}</div>
                <div class="row"><span class="bold">Localidade:</span> ${PRESTADOR.localidade}</div>
                <div class="row"><span class="bold">E-mail:</span> ${PRESTADOR.email}</div>
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
                <div class="row"><span class="bold">Potência:</span> ${potencia} | <span class="bold">Tributação:</span> ${COD_TRIBUTACAO}</div>
                <div class="row"><span class="bold">Forma de Recebimento:</span> ${formaRecebimento}</div>
                <div style="margin-top: 10px;">
                    <div class="bold">Descrição dos Serviços:</div>
                    <div class="desc-box">${descricao}</div>
                </div>
            </div>

            <div class="section">
                <div class="section-title">TRIBUTAÇÃO NACIONAL</div>
                <div class="row"><span class="bold">CST:</span> Nenhum</div>
                <div class="row"><span class="bold">Tipo de Retenção:</span> PIS/COFINS/CSLL Não Retidos</div>
                <div class="row">
                    <span class="bold">Vl. PIS:</span> - | 
                    <span class="bold">Vl. COFINS:</span> - | 
                    <span class="bold">Vl. CSLL:</span> -
                </div>
                <div class="row">
                    <span class="bold">Vl. IRRF:</span> - | 
                    <span class="bold">Vl. CP Retido:</span> -
                </div>
            </div>

            <div class="total-box">Valor Total: R$ ${valor}</div>

            <div class="footer">
                <span class="bold">WSE BOMBAS E MOTORES ELÉTRICOS</span><br/>
                CNPJ: 58.054.890/0001-02 | Contato: (61) 99800-7873
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

            if (Platform.OS === 'web') {
                const printWindow = window.open('', '_blank');
                if (printWindow) {
                    printWindow.document.write(html);
                    printWindow.document.close();
                    setTimeout(() => {
                        printWindow.print();
                        printWindow.close();
                        window.focus();
                        limparCampos();
                    }, 500);
                }
            } else {
                await Print.printAsync({ html });
                limparCampos();
            }
        } catch (error) {
            console.error("Erro ao processar PDF:", error);
        }
    };

    const theme = isDarkMode ? {
        bgApp: '#181824', bgCard: '#252533', textPrimary: '#FFFFFF', textSecondary: '#888888', border: '#333333', btnPrimary: '#38CE3C', textBtnPrimary: '#181824'
    } : {
        bgApp: '#F4F7FE', bgCard: '#FFFFFF', textPrimary: '#1E293B', textSecondary: '#64748B', border: '#E2E8F0', btnPrimary: '#0056D2', textBtnPrimary: '#FFFFFF'
    };

    return (
        <ScrollView style={{ flex: 1, backgroundColor: theme.bgApp }} contentContainerStyle={{ padding: 40, paddingBottom: 100 }}>
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
                        placeholder="Potência (CV)" placeholderTextColor={theme.textSecondary} value={potencia} onChangeText={setPotencia} />
                    <TextInput style={[styles.input, { flex: 1, borderColor: theme.border, color: theme.textPrimary, backgroundColor: theme.bgApp }]}
                        placeholder="Forma de Recebimento" placeholderTextColor={theme.textSecondary} value={formaRecebimento} onChangeText={setFormaRecebimento} />
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